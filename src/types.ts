export enum FileProcessingStatus {
  IDLE = 'idle',
  QUEUED = 'queued',
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  ERROR = 'error',
}

export type ReviewStatus = 'pending' | 'reviewed';

export interface GroundedPoint {
  x: number;
  y: number;
}

export interface GroundedValue {
  value?: string;
  boundingPoly?: GroundedPoint[];
}

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
  rawOcr?: string;
  modelUsed?: string;
  createdAt?: string;
}

export interface AppSettings {
  navidcUrl: string;
  autoStartSidecar: boolean;
  device: string;
  modelPath: string;
  saveProcessedFiles: boolean;
  defaultExportFormat: string;
}

export interface ModelStatus {
  online: boolean;
  modelName: string;
  modelLoaded: boolean;
  device: string;
  message: string;
}

export type AlertType = 'success' | 'error' | 'info' | 'warning';
