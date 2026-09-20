import { invoke } from '@tauri-apps/api/core';
import { AppSettings, InvoiceConfig, ModelStatus, ProcessedInvoice } from '../types';
import { PREDEFINED_CONFIGS } from './configService';

export const isTauri = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

// ─── In-memory fallback for browser dev mode ─────────────────────────────────
let fallbackSettings: AppSettings = {
  ocrModelPath: '',
  ocrThreads: 4,
  ocrGpuLayers: 0,
  extractionModelId: 'E4B',
  extractionModelPath: '',
  extractionThreads: 4,
  extractionGpuLayers: 0,
  saveProcessedFiles: true,
  defaultExportFormat: 'xlsx',
};

let fallbackConfigs: InvoiceConfig[] = [...PREDEFINED_CONFIGS];
let fallbackInvoices: ProcessedInvoice[] = [];

export const tauriService = {
  // ── Settings ──────────────────────────────────────────────────────────────
  async getAppSettings(): Promise<AppSettings> {
    if (isTauri()) return await invoke<AppSettings>('get_app_settings');
    const stored = localStorage.getItem('fatrocu_settings');
    return stored ? JSON.parse(stored) : fallbackSettings;
  },

  async saveAppSettings(settings: AppSettings): Promise<void> {
    if (isTauri()) { await invoke('save_app_settings', { settings }); return; }
    fallbackSettings = settings;
    localStorage.setItem('fatrocu_settings', JSON.stringify(settings));
  },

  // ── Configs ───────────────────────────────────────────────────────────────
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
    if (isTauri()) { await invoke('save_configs', { configs }); return; }
    fallbackConfigs = configs;
    localStorage.setItem('fatrocu_configs', JSON.stringify(configs));
  },

  // ── Invoices ──────────────────────────────────────────────────────────────
  async getInvoices(): Promise<ProcessedInvoice[]> {
    if (isTauri()) return await invoke<ProcessedInvoice[]>('get_invoices');
    const stored = localStorage.getItem('fatrocu_invoices');
    return stored ? JSON.parse(stored) : fallbackInvoices;
  },

  async saveInvoice(invoice: ProcessedInvoice): Promise<void> {
    if (isTauri()) { await invoke('save_invoice', { invoice }); return; }
    const idx = fallbackInvoices.findIndex((i) => i.id === invoice.id);
    if (idx >= 0) fallbackInvoices[idx] = invoice;
    else fallbackInvoices.push(invoice);
    localStorage.setItem('fatrocu_invoices', JSON.stringify(fallbackInvoices));
  },

  async deleteInvoice(invoiceId: string): Promise<void> {
    if (isTauri()) { await invoke('delete_invoice', { invoiceId }); return; }
    fallbackInvoices = fallbackInvoices.filter((i) => i.id !== invoiceId);
    localStorage.setItem('fatrocu_invoices', JSON.stringify(fallbackInvoices));
  },

  async clearInvoices(): Promise<void> {
    if (isTauri()) { await invoke('clear_invoices'); return; }
    fallbackInvoices = [];
    localStorage.removeItem('fatrocu_invoices');
  },

  // ── Engine Status (Faz 1: stub, Faz 2: llama.cpp integration) ────────────
  async checkEngineStatus(): Promise<ModelStatus> {
    if (isTauri()) {
      try {
        return await invoke<ModelStatus>('check_engine_status');
      } catch {
        // command not yet implemented in Faz 1
      }
    }
    return {
      online: false,
      modelName: 'DeepSeek-OCR + Gemma 4',
      modelLoaded: false,
      device: 'CPU',
      message: 'Motor Faz 2\'de entegre edilecek.',
    };
  },

  // ── Processing ────────────────────────────────────────────────────────────
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

    // Browser dev-mode stub
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
            faturaNumarasi:  { value: 'GIB2026000012345678' },
            faturaTarihi:    { value: '20.09.2026' },
            genelToplam:     { value: '1.450,00 TL' },
            saticiUnvan:     { value: 'ÖRNEK TİCARET A.Ş.' },
            saticiVknTckn:   { value: '1234567890' },
            kdvMatrahi:      { value: '1.208,33 TL' },
            kdvTutari:       { value: '241,67 TL' },
          },
          lineItems: [
            {
              kdvOrani:   { value: '%20' },
              kdvMatrahi: { value: '1.208,33' },
              kdvTutari:  { value: '241,67' },
            },
          ],
          ocrModel: 'DeepSeek-OCR (stub)',
          modelUsed: 'Gemma-4-E4B (stub)',
          createdAt: new Date().toISOString(),
        });
      }, 900);
    });
  },

  // ── Export ────────────────────────────────────────────────────────────────
  async exportInvoicesExcel(
    invoices: ProcessedInvoice[],
    configs: InvoiceConfig[],
    targetPath?: string
  ): Promise<string> {
    if (isTauri()) {
      return await invoke<string>('export_invoices_excel', { invoices, configs, targetPath });
    }
    return 'Tauri dışında Excel kaydı desteklenmiyor.';
  },

  async exportInvoicesCsv(
    invoices: ProcessedInvoice[],
    configs: InvoiceConfig[],
    targetPath?: string
  ): Promise<string> {
    if (isTauri()) {
      return await invoke<string>('export_invoices_csv', { invoices, configs, targetPath });
    }
    return 'Tauri dışında CSV kaydı desteklenmiyor.';
  },

  async revealInExplorer(path: string): Promise<void> {
    if (isTauri()) await invoke('reveal_in_explorer', { path });
  },

  async openPath(path: string): Promise<void> {
    if (isTauri()) await invoke('open_path', { path });
  },
};
