pub mod commands;
pub mod excel_export;
pub mod models;
pub mod navidc_client;
pub mod pdf_converter;
pub mod storage;

use commands::*;
use navidc_client::NaviDCClient;
use std::sync::Mutex;
use storage::StorageManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    let storage_manager = StorageManager::new();
    let navidc_client = NaviDCClient::new();

    // Try auto-starting NaviDC sidecar if enabled in settings
    let settings = storage_manager.load_settings();
    if settings.auto_start_sidecar {
        let _ = navidc_client.try_start_sidecar();
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState {
            storage: Mutex::new(storage_manager),
            navidc: navidc_client,
        })
        .invoke_handler(tauri::generate_handler![
            get_app_settings,
            save_app_settings,
            get_configs,
            save_configs,
            get_invoices,
            save_invoice,
            delete_invoice,
            clear_invoices,
            check_navidc_status,
            start_navidc_server,
            process_invoice_from_bytes,
            export_invoices_excel,
            export_invoices_csv,
            reveal_in_explorer,
            open_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running fatrocu tauri application");
}
