use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum FileProcessingStatus {
    Idle,
    Queued,
    Uploading,
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
    pub raw_ocr: Option<String>,
    pub model_used: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub navidc_url: String,
    pub auto_start_sidecar: bool,
    pub device: String, // "cuda" or "cpu"
    pub model_path: String,
    pub save_processed_files: bool,
    pub default_export_format: String, // "xlsx" or "csv"
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            navidc_url: "http://127.0.0.1:8765".to_string(),
            auto_start_sidecar: true,
            device: "cuda".to_string(),
            model_path: "StarDoc-AI/NaviDC-OCR".to_string(),
            save_processed_files: true,
            default_export_format: "xlsx".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelStatus {
    pub online: bool,
    pub model_name: String,
    pub model_loaded: bool,
    pub device: String,
    pub message: String,
}
