use crate::excel_export::ExcelExporter;
use crate::llama_engine::LlamaEngine;
use crate::models::{
    AppSettings, FileProcessingStatus, InvoiceConfig, ModelStatus, ProcessedInvoice, ReviewStatus,
};
use crate::pdf_converter::DocumentProcessor;
use crate::storage::StorageManager;
use log::{error, info};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

pub struct AppState {
    pub storage: Mutex<StorageManager>,
}

// ─── Settings ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_app_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    Ok(storage.load_settings())
}

#[tauri::command]
pub async fn save_app_settings(
    settings: AppSettings,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.save_settings(&settings)
}

// ─── Configs ──────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_configs(state: State<'_, AppState>) -> Result<Vec<InvoiceConfig>, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    Ok(storage.load_configs())
}

#[tauri::command]
pub async fn save_configs(
    configs: Vec<InvoiceConfig>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.save_configs(&configs)
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_invoices(state: State<'_, AppState>) -> Result<Vec<ProcessedInvoice>, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    Ok(storage.load_invoices())
}

#[tauri::command]
pub async fn save_invoice(
    invoice: ProcessedInvoice,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    let mut invoices = storage.load_invoices();
    if let Some(pos) = invoices.iter().position(|i| i.id == invoice.id) {
        invoices[pos] = invoice;
    } else {
        invoices.push(invoice);
    }
    storage.save_invoices(&invoices)
}

#[tauri::command]
pub async fn delete_invoice(invoice_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    let mut invoices = storage.load_invoices();
    invoices.retain(|i| i.id != invoice_id);
    storage.save_invoices(&invoices)
}

#[tauri::command]
pub async fn clear_invoices(state: State<'_, AppState>) -> Result<(), String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.save_invoices(&[])
}

// ─── Engine Status ────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn check_engine_status(state: State<'_, AppState>) -> Result<ModelStatus, String> {
    let settings = {
        let storage = state.storage.lock().map_err(|e| e.to_string())?;
        storage.load_settings()
    };
    Ok(LlamaEngine::check_engine_status(&settings))
}

// ─── Main Processing Command ──────────────────────────────────────────────────

#[tauri::command]
pub async fn process_invoice_from_bytes(
    temp_id: String,
    file_bytes: Vec<u8>,
    file_name: String,
    file_type: String,
    config: InvoiceConfig,
    state: State<'_, AppState>,
) -> Result<ProcessedInvoice, String> {
    info!("İşleme başlandı: {} ({})", file_name, config.name);

    // STEP 0: PDF → PNG veya görsel normalize
    let (raw_image_bytes, _image_b64, data_url) =
        DocumentProcessor::process_bytes_to_image(&file_bytes, &file_name)?;

    let settings = {
        let storage = state.storage.lock().map_err(|e| e.to_string())?;
        storage.load_settings()
    };

    // Görseli AppData'ya kaydet
    let saved_path_str = {
        let storage = state.storage.lock().map_err(|e| e.to_string())?;
        let saved_path = storage.save_image_file(&temp_id, "png", &raw_image_bytes)?;
        saved_path.to_string_lossy().to_string()
    };

    // Manuel şablon → AI pipeline atla
    if config.id == "predefined-manual" {
        return Ok(ProcessedInvoice {
            id: temp_id,
            file_name,
            file_type,
            file_path: Some(saved_path_str),
            preview_image_base64: Some(data_url),
            status: FileProcessingStatus::Success,
            review_status: Some(ReviewStatus::Pending),
            extracted_data: Some(Default::default()),
            line_items: Some(Vec::new()),
            error_message: None,
            config_id: config.id,
            custom_fields: None,
            custom_line_item_fields: None,
            raw_ocr: None,
            raw_markdown: None,
            ocr_model: None,
            model_used: Some("Manuel".to_string()),
            created_at: Some(chrono::Local::now().to_rfc3339()),
        });
    }

    // STEP 1+2: DeepSeek-OCR + Gemma 4 Pipeline
    match LlamaEngine::run_full_pipeline(&raw_image_bytes, &config, &settings) {
        Ok((extracted_data, line_items, raw_markdown, model_used)) => {
            info!("Pipeline başarılı: {}", file_name);
            Ok(ProcessedInvoice {
                id: temp_id,
                file_name,
                file_type,
                file_path: Some(saved_path_str),
                preview_image_base64: Some(data_url),
                status: FileProcessingStatus::Success,
                review_status: Some(ReviewStatus::Pending),
                extracted_data: Some(extracted_data),
                line_items: Some(line_items),
                error_message: None,
                config_id: config.id,
                custom_fields: None,
                custom_line_item_fields: None,
                raw_ocr: Some(raw_markdown.clone()),
                raw_markdown: Some(raw_markdown),
                ocr_model: Some("DeepSeek-OCR-GGUF".to_string()),
                model_used: Some(model_used),
                created_at: Some(chrono::Local::now().to_rfc3339()),
            })
        }
        Err(err) => {
            error!("Pipeline hatası [{}]: {}", file_name, err);
            Ok(ProcessedInvoice {
                id: temp_id,
                file_name,
                file_type,
                file_path: Some(saved_path_str),
                preview_image_base64: Some(data_url),
                status: FileProcessingStatus::Error,
                review_status: None,
                extracted_data: None,
                line_items: None,
                error_message: Some(err),
                config_id: config.id,
                custom_fields: None,
                custom_line_item_fields: None,
                raw_ocr: None,
                raw_markdown: None,
                ocr_model: None,
                model_used: None,
                created_at: Some(chrono::Local::now().to_rfc3339()),
            })
        }
    }
}

// ─── Export Commands ──────────────────────────────────────────────────────────

#[tauri::command]
pub async fn export_invoices_excel(
    invoices: Vec<ProcessedInvoice>,
    configs: Vec<InvoiceConfig>,
    target_path: Option<String>,
) -> Result<String, String> {
    let out_path = if let Some(p) = target_path {
        PathBuf::from(p)
    } else {
        let date_str = chrono::Local::now().format("%Y-%m-%d_%H%M%S").to_string();
        dirs::desktop_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join(format!("Fatrocu_Raporu_{}.xlsx", date_str))
    };

    ExcelExporter::export_to_excel(&invoices, &configs, &out_path)?;
    Ok(out_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn export_invoices_csv(
    invoices: Vec<ProcessedInvoice>,
    configs: Vec<InvoiceConfig>,
    target_path: Option<String>,
) -> Result<String, String> {
    let out_path = if let Some(p) = target_path {
        PathBuf::from(p)
    } else {
        let date_str = chrono::Local::now().format("%Y-%m-%d_%H%M%S").to_string();
        dirs::desktop_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join(format!("Fatrocu_Raporu_{}.csv", date_str))
    };

    ExcelExporter::export_to_csv(&invoices, &configs, &out_path)?;
    Ok(out_path.to_string_lossy().to_string())
}

// ─── Utility Commands ─────────────────────────────────────────────────────────

#[tauri::command]
pub async fn reveal_in_explorer(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn open_path(path: String) -> Result<(), String> {
    open::that(&path).map_err(|e| e.to_string())
}

/// Modeller için AppData/Fatrocu/models dizin yolunu döner
#[tauri::command]
pub async fn get_models_dir() -> Result<String, String> {
    let dir = dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("Fatrocu")
        .join("models");

    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.to_string_lossy().to_string())
}

/// Belirli bir model dosyasının var olup olmadığını kontrol et
#[tauri::command]
pub async fn check_model_exists(file_path: String) -> bool {
    std::path::Path::new(&file_path).exists()
}
