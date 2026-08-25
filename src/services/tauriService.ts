import { invoke } from '@tauri-apps/api/core';
import { AppSettings, InvoiceConfig, ModelStatus, ProcessedInvoice } from '../types';
import { PREDEFINED_CONFIGS } from './configService';

// Check if running inside Tauri
export const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

// Fallback in-memory storage for web testing
let fallbackSettings: AppSettings = {
  navidcUrl: 'http://127.0.0.1:8765',
  autoStartSidecar: true,
  device: 'cuda',
  modelPath: 'StarDoc-AI/NaviDC-OCR',
  saveProcessedFiles: true,
  defaultExportFormat: 'xlsx',
};

let fallbackConfigs: InvoiceConfig[] = [...PREDEFINED_CONFIGS];
let fallbackInvoices: ProcessedInvoice[] = [];

export const tauriService = {
  async getAppSettings(): Promise<AppSettings> {
    if (isTauri()) {
      return await invoke<AppSettings>('get_app_settings');
    }
    const stored = localStorage.getItem('fatrocu_settings');
    return stored ? JSON.parse(stored) : fallbackSettings;
  },

  async saveAppSettings(settings: AppSettings): Promise<void> {
    if (isTauri()) {
      await invoke('save_app_settings', { settings });
      return;
    }
    fallbackSettings = settings;
    localStorage.setItem('fatrocu_settings', JSON.stringify(settings));
  },

  async getConfigs(): Promise<InvoiceConfig[]> {
    if (isTauri()) {
      const configs = await invoke<InvoiceConfig[]>('get_configs');
      if (!configs || configs.length === 0) {
        await invoke('save_configs', { configs: PREDEFINED_CONFIGS });
        return PREDEFINED_CONFIGS;
      }
      return configs;
    }
    const stored = localStorage.getItem('fatrocu_configs');
    return stored ? JSON.parse(stored) : fallbackConfigs;
  },

  async saveConfigs(configs: InvoiceConfig[]): Promise<void> {
    if (isTauri()) {
      await invoke('save_configs', { configs });
      return;
    }
    fallbackConfigs = configs;
    localStorage.setItem('fatrocu_configs', JSON.stringify(configs));
  },

  async getInvoices(): Promise<ProcessedInvoice[]> {
    if (isTauri()) {
      return await invoke<ProcessedInvoice[]>('get_invoices');
    }
    const stored = localStorage.getItem('fatrocu_invoices');
    return stored ? JSON.parse(stored) : fallbackInvoices;
  },

  async saveInvoice(invoice: ProcessedInvoice): Promise<void> {
    if (isTauri()) {
      await invoke('save_invoice', { invoice });
      return;
    }
    const idx = fallbackInvoices.findIndex((i) => i.id === invoice.id);
    if (idx >= 0) {
      fallbackInvoices[idx] = invoice;
    } else {
      fallbackInvoices.push(invoice);
    }
    localStorage.setItem('fatrocu_invoices', JSON.stringify(fallbackInvoices));
  },

  async deleteInvoice(invoiceId: String): Promise<void> {
    if (isTauri()) {
      await invoke('delete_invoice', { invoiceId });
      return;
    }
    fallbackInvoices = fallbackInvoices.filter((i) => i.id !== invoiceId);
    localStorage.setItem('fatrocu_invoices', JSON.stringify(fallbackInvoices));
  },

  async clearInvoices(): Promise<void> {
    if (isTauri()) {
      await invoke('clear_invoices');
      return;
    }
    fallbackInvoices = [];
    localStorage.removeItem('fatrocu_invoices');
  },

  async checkNavidcStatus(): Promise<ModelStatus> {
    if (isTauri()) {
      return await invoke<ModelStatus>('check_navidc_status');
    }
    try {
      const res = await fetch('http://127.0.0.1:8765/health', { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        return {
          online: true,
          modelName: data.model_name || 'StarDoc-AI/NaviDC-OCR',
          modelLoaded: data.model_loaded || false,
          device: data.device || 'GPU',
          message: 'NaviDC-OCR Sunucusu Aktif',
        };
      }
    } catch {
      // offline
    }
    return {
      online: false,
      modelName: 'NaviDC-OCR',
      modelLoaded: false,
      device: 'Bilinmiyor',
      message: 'Sunucuya bağlanılamadı (start_server.bat çalıştırın)',
    };
  },

  async startNavidcServer(): Promise<void> {
    if (isTauri()) {
      await invoke('start_navidc_server');
    }
  },

  async processInvoiceFile(
    file: File,
    tempId: string,
    config: InvoiceConfig
  ): Promise<ProcessedInvoice> {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = Array.from(new Uint8Array(arrayBuffer));

    if (isTauri()) {
      return await invoke<ProcessedInvoice>('process_invoice_from_bytes', {
        tempId,
        fileBytes: bytes,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        config,
      });
    }

    // Web fallback
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: tempId,
          fileName: file.name,
          fileType: file.type,
          status: 'success' as any,
          reviewStatus: 'pending',
          configId: config.id,
          extractedData: {
            faturaNumarasi: { value: 'GIB2026000012345', boundingPoly: [] },
            faturaTarihi: { value: '25.08.2026', boundingPoly: [] },
            genelToplam: { value: '1.450,00 TL', boundingPoly: [] },
            saticiUnvan: { value: 'ÖRNEK TİCARET A.Ş.', boundingPoly: [] },
          },
          lineItems: [
            {
              kdvOrani: { value: '%20' },
              kdvMatrahi: { value: '1.208,33' },
              kdvTutari: { value: '241,67' },
            },
          ],
          modelUsed: 'NaviDC-OCR-WebFallback',
          createdAt: new Date().toISOString(),
        });
      }, 1000);
    });
  },

  async exportInvoicesExcel(
    invoices: ProcessedInvoice[],
    configs: InvoiceConfig[],
    targetPath?: string
  ): Promise<string> {
    if (isTauri()) {
      return await invoke<string>('export_invoices_excel', {
        invoices,
        configs,
        targetPath,
      });
    }
    return 'Web ortamında Excel kaydedildi.';
  },

  async exportInvoicesCsv(
    invoices: ProcessedInvoice[],
    configs: InvoiceConfig[],
    targetPath?: string
  ): Promise<string> {
    if (isTauri()) {
      return await invoke<string>('export_invoices_csv', {
        invoices,
        configs,
        targetPath,
      });
    }
    return 'Web ortamında CSV kaydedildi.';
  },

  async revealInExplorer(path: string): Promise<void> {
    if (isTauri()) {
      await invoke('reveal_in_explorer', { path });
    }
  },

  async openPath(path: string): Promise<void> {
    if (isTauri()) {
      await invoke('open_path', { path });
    }
  },
};
