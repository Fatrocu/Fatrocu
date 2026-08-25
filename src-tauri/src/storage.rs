use crate::models::{AppSettings, InvoiceConfig, ProcessedInvoice};
use std::fs;
use std::path::PathBuf;

pub struct StorageManager {
    base_dir: PathBuf,
}

impl StorageManager {
    pub fn new() -> Self {
        let base_dir = dirs::data_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("Fatrocu");

        if !base_dir.exists() {
            let _ = fs::create_dir_all(&base_dir);
            let _ = fs::create_dir_all(base_dir.join("images"));
        }

        Self { base_dir }
    }

    pub fn get_images_dir(&self) -> PathBuf {
        let path = self.base_dir.join("images");
        if !path.exists() {
            let _ = fs::create_dir_all(&path);
        }
        path
    }

    pub fn load_settings(&self) -> AppSettings {
        let path = self.base_dir.join("settings.json");
        if path.exists() {
            if let Ok(content) = fs::read_to_string(&path) {
                if let Ok(settings) = serde_json::from_str::<AppSettings>(&content) {
                    return settings;
                }
            }
        }
        let default_settings = AppSettings::default();
        let _ = self.save_settings(&default_settings);
        default_settings
    }

    pub fn save_settings(&self, settings: &AppSettings) -> Result<(), String> {
        let path = self.base_dir.join("settings.json");
        let content = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
        fs::write(path, content).map_err(|e| e.to_string())
    }

    pub fn load_configs(&self) -> Vec<InvoiceConfig> {
        let path = self.base_dir.join("configs.json");
        if path.exists() {
            if let Ok(content) = fs::read_to_string(&path) {
                if let Ok(configs) = serde_json::from_str::<Vec<InvoiceConfig>>(&content) {
                    return configs;
                }
            }
        }
        Vec::new()
    }

    pub fn save_configs(&self, configs: &[InvoiceConfig]) -> Result<(), String> {
        let path = self.base_dir.join("configs.json");
        let content = serde_json::to_string_pretty(configs).map_err(|e| e.to_string())?;
        fs::write(path, content).map_err(|e| e.to_string())
    }

    pub fn load_invoices(&self) -> Vec<ProcessedInvoice> {
        let path = self.base_dir.join("invoices.json");
        if path.exists() {
            if let Ok(content) = fs::read_to_string(&path) {
                if let Ok(invoices) = serde_json::from_str::<Vec<ProcessedInvoice>>(&content) {
                    return invoices;
                }
            }
        }
        Vec::new()
    }

    pub fn save_invoices(&self, invoices: &[ProcessedInvoice]) -> Result<(), String> {
        let path = self.base_dir.join("invoices.json");
        let content = serde_json::to_string_pretty(invoices).map_err(|e| e.to_string())?;
        fs::write(path, content).map_err(|e| e.to_string())
    }

    pub fn save_image_file(&self, id: &str, extension: &str, data: &[u8]) -> Result<PathBuf, String> {
        let filename = format!("{}.{}", id, extension);
        let path = self.get_images_dir().join(filename);
        fs::write(&path, data).map_err(|e| e.to_string())?;
        Ok(path)
    }
}
