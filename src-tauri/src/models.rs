use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ─── Processing & Review Status ───────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum FileProcessingStatus {
    Idle,
    Queued,
    Processing,
    Success,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum ReviewStatus {
    Pending,
    Reviewed,
}

// ─── Data Primitives ──────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GroundedPoint {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct GroundedValue {
    pub value: Option<String>,
    pub bounding_poly: Option<Vec<GroundedPoint>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FieldConfig {
    pub key: String,
    pub label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InvoiceConfig {
    pub id: String,
    pub name: String,
    pub is_predefined: bool,
    pub fields: Vec<FieldConfig>,
    pub line_item_fields: Option<Vec<FieldConfig>>,
}

pub type ExtractedInvoiceFields = HashMap<String, GroundedValue>;
pub type LineItem = HashMap<String, GroundedValue>;

// ─── Processed Invoice ────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessedInvoice {
    pub id: String,
    pub file_name: String,
    pub file_type: String,
    pub file_path: Option<String>,
    pub preview_image_base64: Option<String>,
    pub status: FileProcessingStatus,
    pub review_status: Option<ReviewStatus>,
    pub extracted_data: Option<ExtractedInvoiceFields>,
    pub line_items: Option<Vec<LineItem>>,
    pub error_message: Option<String>,
    pub config_id: String,
    pub custom_fields: Option<Vec<FieldConfig>>,
    pub custom_line_item_fields: Option<Vec<FieldConfig>>,
    pub raw_ocr: Option<String>,      // DeepSeek-OCR markdown çıktısı
    pub raw_markdown: Option<String>, // alias (backward compat)
    pub ocr_model: Option<String>,    // hangi OCR modeli kullanıldı
    pub model_used: Option<String>,   // Gemma extraction modeli
    pub created_at: Option<String>,
}

// ─── App Settings — Yeni Pipeline Şeması ─────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    // DeepSeek-OCR (GGUF) — llama.cpp ile çalışır
    pub ocr_model_path: String,
    pub ocr_threads: u32,
    pub ocr_gpu_layers: u32,

    // Gemma 4 (GGUF) — alan çıkarma asistanı
    pub extraction_model_id: String,   // "E2B" | "E4B" | "12B" | "custom"
    pub extraction_model_path: String,
    pub extraction_threads: u32,
    pub extraction_gpu_layers: u32,

    // Genel
    pub save_processed_files: bool,
    pub default_export_format: String, // "xlsx" | "csv"
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            ocr_model_path: String::new(),
            ocr_threads: 4,
            ocr_gpu_layers: 0,
            extraction_model_id: "E4B".to_string(),
            extraction_model_path: String::new(),
            extraction_threads: 4,
            extraction_gpu_layers: 0,
            save_processed_files: true,
            default_export_format: "xlsx".to_string(),
        }
    }
}

// ─── Engine/Model Status ──────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelStatus {
    pub online: bool,
    pub model_name: String,
    pub model_loaded: bool,
    pub device: String,
    pub message: String,
}

// ─── Download Progress ────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgress {
    pub model_id: String,
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
    pub percent: f32,
    pub done: bool,
    pub error: Option<String>,
}
