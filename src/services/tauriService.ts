/**
 * tauriService.ts — Fatrocu Faz 2
 * Tauri IPC komutlarını çağırır. Web modunda (Tauri dışı) stub döner.
 * Pipeline: görsel/PDF → DeepSeek-OCR (markdown) → Gemma 4 (JSON)
 */

import { invoke } from '@tauri-apps/api/core';
import {
  AppSettings,
  InvoiceConfig,
  ProcessedInvoice,
  ModelStatus,
  FileProcessingStatus,
  GemmaVariant,
} from '../types';
import { PREDEFINED_CONFIGS } from './configService';

// ─── Tauri Ortam Tespiti ───────────────────────────────────────────────────────
const IS_TAURI = typeof (window as any).__TAURI_INTERNALS__ !== 'undefined';

const DEFAULT_SETTINGS: AppSettings = {
  ocrModelPath: '',
  ocrThreads: 4,
  ocrGpuLayers: 0,
  extractionModelId: 'E4B' as GemmaVariant,
  extractionModelPath: '',
  extractionThreads: 4,
  extractionGpuLayers: 0,
  saveProcessedFiles: true,
  defaultExportFormat: 'xlsx',
};

// ─── Helper — File → Base64 bytes array ───────────────────────────────────────
async function fileToUint8Array(file: File): Promise<number[]> {
  const ab = await file.arrayBuffer();
  return Array.from(new Uint8Array(ab));
}

// ─── TauriService ─────────────────────────────────────────────────────────────
class TauriService {

  // ── Settings ─────────────────────────────────────────────────────────────────
  async getAppSettings(): Promise<AppSettings | null> {
    if (!IS_TAURI) return DEFAULT_SETTINGS;
    try {
      return await invoke<AppSettings>('get_app_settings');
    } catch (e) {
      console.error('getAppSettings error:', e);
      return DEFAULT_SETTINGS;
    }
  }

  async saveAppSettings(settings: AppSettings): Promise<void> {
    if (!IS_TAURI) return;
    await invoke('save_app_settings', { settings });
  }

  // ── Configs ───────────────────────────────────────────────────────────────────
  async getConfigs(): Promise<InvoiceConfig[]> {
    if (!IS_TAURI) return PREDEFINED_CONFIGS;
    try {
      const configs = await invoke<InvoiceConfig[]>('get_configs');
      return configs && configs.length > 0 ? configs : PREDEFINED_CONFIGS;
    } catch {
      return PREDEFINED_CONFIGS;
    }
  }

  async saveConfigs(configs: InvoiceConfig[]): Promise<void> {
    if (!IS_TAURI) return;
    await invoke('save_configs', { configs });
  }

  // ── Invoices ──────────────────────────────────────────────────────────────────
  async getInvoices(): Promise<ProcessedInvoice[]> {
    if (!IS_TAURI) return [];
    try {
      return await invoke<ProcessedInvoice[]>('get_invoices');
    } catch {
      return [];
    }
  }

  async saveInvoice(invoice: ProcessedInvoice): Promise<void> {
    if (!IS_TAURI) return;
    await invoke('save_invoice', { invoice });
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    if (!IS_TAURI) return;
    await invoke('delete_invoice', { invoiceId });
  }

  async clearInvoices(): Promise<void> {
    if (!IS_TAURI) return;
    await invoke('clear_invoices');
  }

  // ── Engine Status ─────────────────────────────────────────────────────────────
  async checkEngineStatus(): Promise<ModelStatus | null> {
    if (!IS_TAURI) {
      // Web stub — llama.cpp binary yoktur
      return {
        online: false,
        modelName: 'Web Geliştirme Modu',
        modelLoaded: false,
        device: '—',
        message: 'Tauri uygulaması dışında pipeline çalışmaz.',
      };
    }
    try {
      return await invoke<ModelStatus>('check_engine_status');
    } catch (e) {
      return {
        online: false,
        modelName: 'Motor durumu alınamadı',
        modelLoaded: false,
        device: '—',
        message: String(e),
      };
    }
  }

  // ── Ana Pipeline İşleme ───────────────────────────────────────────────────────
  /**
   * Bir fatura dosyasını (PDF veya görsel) işler.
   * Sıra:
   *   1. File → Uint8Array (frontend)
   *   2. Rust: process_invoice_from_bytes
   *      → DocumentProcessor: PDF → 300 DPI PNG
   *      → LlamaEngine: DeepSeek-OCR (markdown) → Gemma 4 (JSON)
   *   3. ProcessedInvoice döner
   */
  async processInvoiceFile(
    file: File,
    tempId: string,
    config: InvoiceConfig
  ): Promise<ProcessedInvoice> {
    if (!IS_TAURI) {
      // Web geliştirme stub'u
      return this._webStubInvoice(file, tempId, config);
    }

    const fileBytes = await fileToUint8Array(file);

    const result = await invoke<ProcessedInvoice>('process_invoice_from_bytes', {
      tempId,
      fileBytes,
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      config,
    });

    return result;
  }

  // ── Export ────────────────────────────────────────────────────────────────────
  async exportInvoicesExcel(
    invoices: ProcessedInvoice[],
    configs: InvoiceConfig[]
  ): Promise<string> {
    if (!IS_TAURI) throw new Error('Export yalnızca Tauri uygulamasında çalışır.');
    return await invoke<string>('export_invoices_excel', {
      invoices,
      configs,
      targetPath: null,
    });
  }

  async exportInvoicesCsv(
    invoices: ProcessedInvoice[],
    configs: InvoiceConfig[]
  ): Promise<string> {
    if (!IS_TAURI) throw new Error('Export yalnızca Tauri uygulamasında çalışır.');
    return await invoke<string>('export_invoices_csv', {
      invoices,
      configs,
      targetPath: null,
    });
  }

  // ── Utility ───────────────────────────────────────────────────────────────────
  async revealInExplorer(path: string): Promise<void> {
    if (!IS_TAURI) return;
    await invoke('reveal_in_explorer', { path });
  }

  async openPath(path: string): Promise<void> {
    if (!IS_TAURI) return;
    await invoke('open_path', { path });
  }

  async getModelsDir(): Promise<string> {
    if (!IS_TAURI) return '';
    return await invoke<string>('get_models_dir');
  }

  async openModelsFolder(): Promise<void> {
    if (!IS_TAURI) return;
    await invoke('open_models_folder');
  }

  async importModelFile(sourcePath: string): Promise<string> {
    if (!IS_TAURI) return 'Web modunda model ekleme desteklenmez.';
    return await invoke<string>('import_model_file', { sourcePath });
  }

  async autoInstallLlamaEngine(): Promise<string> {
    if (!IS_TAURI) return 'Web modunda motor kurulumu desteklenmez.';
    return await invoke<string>('auto_install_llama_engine');
  }

  async checkModelExists(filePath: string): Promise<boolean> {
    if (!IS_TAURI) return false;
    return await invoke<boolean>('check_model_exists', { filePath });
  }

  // ── Web Dev Stub ──────────────────────────────────────────────────────────────
  private _webStubInvoice(
    file: File,
    tempId: string,
    config: InvoiceConfig
  ): ProcessedInvoice {
    const fields: Record<string, any> = {};
    config.fields.forEach((f) => {
      fields[f.key] = { value: `[WEB STUB] ${f.label}` };
    });

    return {
      id: tempId,
      fileName: file.name,
      fileType: file.type,
      status: FileProcessingStatus.SUCCESS,
      reviewStatus: 'pending',
      extractedData: fields,
      lineItems: [],
      configId: config.id,
      rawOcr: '[Web modu — DeepSeek-OCR pipeline çalışmıyor]',
      ocrModel: 'stub',
      modelUsed: 'stub',
      createdAt: new Date().toISOString(),
    };
  }
}

export const tauriService = new TauriService();
