pub mod commands;
pub mod excel_export;
pub mod llama_engine;
pub mod models;
pub mod pdf_converter;
pub mod storage;

// navidc_client kaldırıldı — Faz 2: llama_engine kullanılıyor

use commands::*;
use std::sync::Mutex;
use storage::StorageManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    let storage_manager = StorageManager::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState {
            storage: Mutex::new(storage_manager),
        })
        .invoke_handler(tauri::generate_handler![
            // Settings
            get_app_settings,
            save_app_settings,
            // Configs
            get_configs,
            save_configs,
            // Invoices
            get_invoices,
            save_invoice,
            delete_invoice,
            clear_invoices,
            // Engine / Pipeline
            check_engine_status,
            process_invoice_from_bytes,
            // Export
            export_invoices_excel,
            export_invoices_csv,
            // Utilities
            reveal_in_explorer,
            open_path,
            get_models_dir,
            open_models_folder,
            import_model_file,
            auto_install_llama_engine,
            check_model_exists,
        ])
        .run(tauri::generate_context!())
        .expect("Fatrocu uygulama başlatılamadı.");
}
