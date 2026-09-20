// ─── Pipeline Status ────────────────────────────────────────────────────────
export type PipelineStatus = 'idle' | 'converting' | 'ocr' | 'extraction' | 'done' | 'error';

export enum FileProcessingStatus {
  IDLE = 'idle',
  QUEUED = 'queued',
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  ERROR = 'error',
}

export type ReviewStatus = 'pending' | 'reviewed';

// ─── OCR / Field Geometry ───────────────────────────────────────────────────
export interface GroundedPoint {
  x: number;
  y: number;
}

export interface GroundedValue {
  value?: string;
  boundingPoly?: GroundedPoint[];
}

// ─── Invoice Config / Template ──────────────────────────────────────────────
export interface FieldConfig {
  key: string;
  label: string;
}

export interface InvoiceConfig {
  id: string;
  name: string;
  isPredefined: boolean;
  fields: FieldConfig[];
  lineItemFields?: FieldConfig[];
}

// ─── Processed Document ─────────────────────────────────────────────────────
export interface ExtractedInvoiceFields {
  [key: string]: GroundedValue | undefined;
}

export interface ProcessedInvoice {
  id: string;
  fileName: string;
  fileType: string;
  filePath?: string;
  previewImageBase64?: string;
  status: FileProcessingStatus;
  reviewStatus?: ReviewStatus;
  extractedData?: ExtractedInvoiceFields;
  lineItems?: Array<{ [key: string]: GroundedValue | undefined }>;
  errorMessage?: string;
  configId: string;
  customFields?: FieldConfig[];
  customLineItemFields?: FieldConfig[];
  rawOcr?: string;         // Raw markdown from DeepSeek-OCR
  rawMarkdown?: string;    // Alias kept for Faz 2 compatibility
  modelUsed?: string;      // Which Gemma variant was used for extraction
  ocrModel?: string;       // DeepSeek-OCR model identifier
  createdAt?: string;
}

// ─── Model Management (Faz 2 ready) ─────────────────────────────────────────
export type GemmaVariant = 'E2B' | 'E4B' | '12B' | 'custom';

export interface ManagedModel {
  id: GemmaVariant | string;
  label: string;
  repo: string;          // HuggingFace repo
  filename: string;      // GGUF filename pattern
  sizeGb: number;
  isDefault: boolean;
  isDownloaded: boolean;
  downloadProgress?: number; // 0-100
}

// ─── App Settings ─────────────────────────────────────────────────────────────
export interface AppSettings {
  // OCR engine (DeepSeek-OCR via llama.cpp)
  ocrModelPath: string;
  ocrThreads: number;
  ocrGpuLayers: number;          // 0 = CPU-only, >0 = offload layers to GPU

  // Extraction assistant (Gemma 4 via llama.cpp)
  extractionModelId: GemmaVariant | string;
  extractionModelPath: string;
  extractionThreads: number;
  extractionGpuLayers: number;

  // Legacy / compatibility (kept for Faz 2 migration)
  navidcUrl?: string;

  // General
  saveProcessedFiles: boolean;
  defaultExportFormat: 'xlsx' | 'csv';
}

// ─── Engine / Model Status ───────────────────────────────────────────────────
export interface ModelStatus {
  online: boolean;
  modelName: string;
  modelLoaded: boolean;
  device: string;          // 'CPU' | 'GPU (N layers)' | 'Unknown'
  message: string;
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────
export type AlertType = 'success' | 'error' | 'info' | 'warning';
