/// llama_engine.rs
/// Fatrocu Faz 2 — DeepSeek-OCR + Gemma 4 Pipeline
///
/// Pipeline:
///   görsel/PDF (PNG bytes) 
///     → DeepSeek-OCR GGUF (llama.cpp subprocess) → Markdown metin
///     → Gemma 4 GGUF    (llama.cpp subprocess) → JSON yapılandırılmış alanlar
///
/// Her iki model de llama.cpp `llama-cli` veya `llama-server` ile çalışır.
/// GPU: opsiyonel (gpu_layers > 0 ise CUDA/Vulkan/Metal offload aktif olur).
/// NVIDIA/CUDA zorunluluğu YOK — tamamen CPU modunda da çalışır.

use crate::models::{AppSettings, ExtractedInvoiceFields, GroundedValue, InvoiceConfig, LineItem, ModelStatus};
use log::{info, warn};
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::{Command, Stdio};

// ─── Model ID → HuggingFace Repo / varsayılan dosya adı ───────────────────────

pub fn gemma_model_info(model_id: &str) -> (&'static str, &'static str) {
    match model_id {
        "E2B" => (
            "unsloth/gemma-4-E2B-it-GGUF",
            "gemma-4-E2B-it-Q4_K_M.gguf",
        ),
        "E4B" => (
            "unsloth/gemma-4-E4B-it-GGUF",
            "gemma-4-E4B-it-Q4_K_M.gguf",
        ),
        "12B" => (
            "unsloth/gemma-4-12b-it-GGUF",
            "gemma-4-12b-it-Q4_K_M.gguf",
        ),
        _ => ("custom", "model.gguf"),
    }
}

pub fn deepseek_ocr_default_filename() -> &'static str {
    "DeepSeek-OCR-GGUF.gguf"
}

// ─── Engine State Check ───────────────────────────────────────────────────────

pub struct LlamaEngine;

impl LlamaEngine {
    /// llama-cli binary'sini bul (PATH'te veya uygulama yanında)
    fn find_llama_cli() -> Option<PathBuf> {
        // 1. PATH'te mi?
        let candidates = if cfg!(windows) {
            vec!["llama-cli.exe", "llama.exe", "main.exe"]
        } else {
            vec!["llama-cli", "llama", "main"]
        };

        for name in &candidates {
            if let Ok(path) = which::which(name) {
                return Some(path);
            }
        }

        // 2. Uygulama dizininde veya bin/ alt klasöründe mi?
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                for name in &candidates {
                    let p = exe_dir.join(name);
                    if p.exists() {
                        return Some(p);
                    }
                    let bin_p = exe_dir.join("bin").join(name);
                    if bin_p.exists() {
                        return Some(bin_p);
                    }
                }
            }
        }

        // 3. %APPDATA%\Fatrocu\bin dizininde mi?
        if let Some(data_dir) = dirs::data_dir() {
            let app_bin = data_dir.join("Fatrocu").join("bin");
            for name in &candidates {
                let p = app_bin.join(name);
                if p.exists() {
                    return Some(p);
                }
            }
        }

        None
    }

    /// Ayarlardaki model dosya yolunu çöz
    fn resolve_ocr_model_path(settings: &AppSettings) -> Option<PathBuf> {
        if settings.ocr_model_path.is_empty() {
            None
        } else {
            let p = PathBuf::from(&settings.ocr_model_path);
            if p.exists() { Some(p) } else { None }
        }
    }

    fn resolve_extraction_model_path(settings: &AppSettings) -> Option<PathBuf> {
        let path_str = if settings.extraction_model_id == "custom" {
            settings.extraction_model_path.clone()
        } else {
            // Varsayılan lokasyon: AppData/Fatrocu/models/<filename>
            let (_, filename) = gemma_model_info(&settings.extraction_model_id);
            if let Some(data_dir) = dirs::data_dir() {
                let p = data_dir
                    .join("Fatrocu")
                    .join("models")
                    .join(filename);
                if p.exists() {
                    return Some(p);
                }
                // Alternatif: doğrudan extraction_model_path'e bak
                return if settings.extraction_model_path.is_empty() {
                    None
                } else {
                    let ep = PathBuf::from(&settings.extraction_model_path);
                    if ep.exists() { Some(ep) } else { None }
                };
            }
            return None;
        };

        if path_str.is_empty() {
            None
        } else {
            let p = PathBuf::from(&path_str);
            if p.exists() { Some(p) } else { None }
        }
    }

    /// Motorun durumunu kontrol et
    pub fn check_engine_status(settings: &AppSettings) -> ModelStatus {
        let cli = Self::find_llama_cli();
        let ocr_model = Self::resolve_ocr_model_path(settings);
        let ext_model = Self::resolve_extraction_model_path(settings);

        if cli.is_none() {
            return ModelStatus {
                online: false,
                model_name: "llama-cli bulunamadı".to_string(),
                model_loaded: false,
                device: "—".to_string(),
                message: "llama-cli PATH'te bulunamadı. https://github.com/ggerganov/llama.cpp adresinden indirin.".to_string(),
            };
        }

        let device = if settings.ocr_gpu_layers > 0 || settings.extraction_gpu_layers > 0 {
            "GPU + CPU".to_string()
        } else {
            "CPU".to_string()
        };

        match (ocr_model.is_some(), ext_model.is_some()) {
            (true, true) => ModelStatus {
                online: true,
                model_name: format!(
                    "DeepSeek-OCR + Gemma 4 {}",
                    settings.extraction_model_id
                ),
                model_loaded: true,
                device,
                message: "Her iki model de hazır. Pipeline çalışabilir.".to_string(),
            },
            (false, false) => ModelStatus {
                online: false,
                model_name: "Model dosyaları bulunamadı".to_string(),
                model_loaded: false,
                device,
                message: "OCR modeli ve çıkarma modeli bulunamadı. Ayarlar sayfasından yolları girin.".to_string(),
            },
            (false, true) => ModelStatus {
                online: false,
                model_name: "DeepSeek-OCR eksik".to_string(),
                model_loaded: false,
                device,
                message: "Gemma 4 hazır, DeepSeek-OCR model dosyası bulunamadı.".to_string(),
            },
            (true, false) => ModelStatus {
                online: false,
                model_name: "Gemma 4 eksik".to_string(),
                model_loaded: false,
                device,
                message: "DeepSeek-OCR hazır, Gemma 4 model dosyası bulunamadı.".to_string(),
            },
        }
    }

    // ─── STEP 1: DeepSeek-OCR — PNG → Markdown ────────────────────────────────

    /// Görsel byte'larını DeepSeek-OCR modeline gönderir, markdown string döner.
    pub fn ocr_image_to_markdown(
        image_bytes: &[u8],
        settings: &AppSettings,
    ) -> Result<String, String> {
        let cli = Self::find_llama_cli()
            .ok_or_else(|| "llama-cli bulunamadı. PATH'e ekleyin.".to_string())?;

        let model_path = Self::resolve_ocr_model_path(settings)
            .ok_or_else(|| "DeepSeek-OCR model dosyası bulunamadı. Ayarlardan yolu girin.".to_string())?;

        // Görseli temp dosyaya yaz (llama.cpp multimodal için dosya yolu kullanır)
        let tmp_img_path = std::env::temp_dir().join(format!(
            "fatrocu_ocr_{}.png",
            uuid::Uuid::new_v4()
        ));
        std::fs::write(&tmp_img_path, image_bytes)
            .map_err(|e| format!("Temp görsel dosyası yazılamadı: {}", e))?;

        let gpu_arg = settings.ocr_gpu_layers.to_string();
        let threads_arg = settings.ocr_threads.to_string();

        // DeepSeek-OCR için OCR prompt (belgeyi markdown'a çevir, tablo yapısını koru)
        let prompt = r#"<image>
Convert this invoice/document image to structured markdown text. Preserve all table layouts, column alignments, and field values exactly as they appear. Output only the markdown text, no explanations."#;

        info!("DeepSeek-OCR başlatılıyor: model={}", model_path.display());

        let output = Command::new(&cli)
            .args([
                "--model", model_path.to_str().unwrap_or(""),
                "--image", tmp_img_path.to_str().unwrap_or(""),
                "--prompt", prompt,
                "--n-predict", "2048",
                "--temp", "0.0",
                "--n-gpu-layers", &gpu_arg,
                "--threads", &threads_arg,
                "--log-disable",
                "--no-display-prompt",
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .map_err(|e| format!("llama-cli çalıştırılamadı: {}", e))?;

        // Temp dosyayı temizle
        let _ = std::fs::remove_file(&tmp_img_path);

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            warn!("DeepSeek-OCR stderr: {}", stderr);
            // Stderr bazı bilgi mesajları içerebilir; stdout'a bakalım
        }

        let markdown = String::from_utf8_lossy(&output.stdout).to_string();

        if markdown.trim().is_empty() {
            return Err("DeepSeek-OCR boş çıktı döndürdü. Model dosyasını ve yolunu kontrol edin.".to_string());
        }

        info!("DeepSeek-OCR tamamlandı, {} karakter markdown üretildi.", markdown.len());
        Ok(markdown)
    }

    // ─── STEP 2: Gemma 4 — Markdown → JSON Fields ─────────────────────────────

    /// Markdown metnini Gemma 4'e göndererek yapılandırılmış JSON alanlarını çıkarır.
    pub fn extract_fields_from_markdown(
        markdown: &str,
        config: &InvoiceConfig,
        settings: &AppSettings,
    ) -> Result<(ExtractedInvoiceFields, Vec<LineItem>), String> {
        let cli = Self::find_llama_cli()
            .ok_or_else(|| "llama-cli bulunamadı.".to_string())?;

        let model_path = Self::resolve_extraction_model_path(settings)
            .ok_or_else(|| format!(
                "Gemma 4 ({}) model dosyası bulunamadı. Ayarlardan yolu girin.",
                settings.extraction_model_id
            ))?;

        // Belge alanlarını sırala
        let field_list: Vec<String> = config
            .fields
            .iter()
            .map(|f| format!("  - \"{}\" (key: \"{}\")", f.label, f.key))
            .collect();

        let line_fields: Vec<String> = config
            .line_item_fields
            .as_deref()
            .unwrap_or(&[])
            .iter()
            .map(|f| format!("  - \"{}\" (key: \"{}\")", f.label, f.key))
            .collect();

        let has_line_items = !line_fields.is_empty();

        let line_items_section = if has_line_items {
            format!(
                "\nLine item columns to extract (one JSON object per row):\n{}\n",
                line_fields.join("\n")
            )
        } else {
            String::new()
        };

        // Structured extraction prompt (Gemma 4 chat format)
        let system_prompt = format!(
            r#"You are a structured data extraction assistant. Extract invoice fields from the given markdown document text and return ONLY a valid JSON object with no extra commentary.

Fields to extract:
{}
{}
Return format:
{{
  "fields": {{
    "<key>": "<extracted value or empty string if not found>"
  }},
  "lineItems": [
    {{ "<key>": "<value>", ... }}
  ]
}}

Rules:
- Return ONLY the JSON object. No markdown fences. No explanations.  
- If a field is not found, use an empty string "".
- Monetary values: keep original format (e.g., "1.250,00" or "1250.00").
- lineItems array: one object per table row. Empty array if no rows found."#,
            field_list.join("\n"),
            line_items_section
        );

        let user_prompt = format!("Document markdown:\n\n{}", markdown);
        let full_prompt = format!("<start_of_turn>user\n{}\n\n{}\n<end_of_turn>\n<start_of_turn>model\n{{", system_prompt, user_prompt);

        let gpu_arg = settings.extraction_gpu_layers.to_string();
        let threads_arg = settings.extraction_threads.to_string();

        info!("Gemma 4 alan çıkarma başlatılıyor: model={}", model_path.display());

        let child = Command::new(&cli)
            .args([
                "--model", model_path.to_str().unwrap_or(""),
                "--prompt", &full_prompt,
                "--n-predict", "1024",
                "--temp", "0.0",
                "--n-gpu-layers", &gpu_arg,
                "--threads", &threads_arg,
                "--log-disable",
                "--no-display-prompt",
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Gemma 4 llama-cli başlatılamadı: {}", e))?;

        let output = child
            .wait_with_output()
            .map_err(|e| format!("Gemma 4 çıktısı okunamadı: {}", e))?;

        let raw_out = String::from_utf8_lossy(&output.stdout).to_string();

        // Prompt'ta "{" ile başladık, bunu geri ekle
        let json_candidate = format!("{{{}", raw_out);

        // JSON'u parse et
        Self::parse_extraction_json(&json_candidate, config)
    }

    /// Ham JSON string'ini parse edip ExtractedInvoiceFields ve LineItems'a dönüştür
    fn parse_extraction_json(
        raw: &str,
        config: &InvoiceConfig,
    ) -> Result<(ExtractedInvoiceFields, Vec<LineItem>), String> {
        // JSON bloğunu bul (ilk { dan son } a kadar)
        let start = raw.find('{').unwrap_or(0);
        let end = raw.rfind('}').map(|i| i + 1).unwrap_or(raw.len());
        let json_str = &raw[start..end];

        let parsed: serde_json::Value = serde_json::from_str(json_str)
            .map_err(|e| format!("JSON parse hatası: {} — Ham: {}", e, &json_str[..json_str.len().min(300)]))?;

        let mut fields: ExtractedInvoiceFields = HashMap::new();
        let mut line_items: Vec<LineItem> = Vec::new();

        // "fields" nesnesini ayrıştır
        if let Some(fields_obj) = parsed.get("fields").and_then(|v| v.as_object()) {
            for field in &config.fields {
                let value = fields_obj
                    .get(&field.key)
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                fields.insert(
                    field.key.clone(),
                    GroundedValue {
                        value: Some(value),
                        bounding_poly: None,
                    },
                );
            }
        }

        // "lineItems" dizisini ayrıştır
        if let Some(items_arr) = parsed.get("lineItems").and_then(|v| v.as_array()) {
            let line_field_keys: Vec<&str> = config
                .line_item_fields
                .as_deref()
                .unwrap_or(&[])
                .iter()
                .map(|f| f.key.as_str())
                .collect();

            for item in items_arr {
                if let Some(item_obj) = item.as_object() {
                    let mut row: LineItem = HashMap::new();
                    for key in &line_field_keys {
                        let val = item_obj
                            .get(*key)
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string();
                        row.insert(
                            key.to_string(),
                            GroundedValue {
                                value: Some(val),
                                bounding_poly: None,
                            },
                        );
                    }
                    if !row.is_empty() {
                        line_items.push(row);
                    }
                }
            }
        }

        info!(
            "Alan çıkarma tamamlandı: {} alan, {} satır kalemi.",
            fields.len(),
            line_items.len()
        );

        Ok((fields, line_items))
    }

    // ─── FULL PIPELINE ────────────────────────────────────────────────────────

    /// Ana pipeline: PNG bytes → (ExtractedFields, LineItems, raw_markdown, model_used)
    pub fn run_full_pipeline(
        image_bytes: &[u8],
        config: &InvoiceConfig,
        settings: &AppSettings,
    ) -> Result<(ExtractedInvoiceFields, Vec<LineItem>, String, String), String> {
        // STEP 1: DeepSeek-OCR → Markdown
        let markdown = Self::ocr_image_to_markdown(image_bytes, settings)?;

        // STEP 2: Gemma 4 → JSON Fields
        let (fields, line_items) = Self::extract_fields_from_markdown(&markdown, config, settings)?;

        let model_used = format!(
            "DeepSeek-OCR → Gemma 4 {}",
            settings.extraction_model_id
        );

        Ok((fields, line_items, markdown, model_used))
    }
}

// ─── which crate shim (PATH search) ──────────────────────────────────────────
// which crate'i bağımlılık olarak ekleyeceğiz, bu bir wrapper

mod which {
    use std::path::PathBuf;
    use std::env;

    pub fn which(name: &str) -> Result<PathBuf, ()> {
        let path_var = env::var("PATH").unwrap_or_default();
        let separator = if cfg!(windows) { ';' } else { ':' };

        for dir in path_var.split(separator) {
            let candidate = PathBuf::from(dir).join(name);
            if candidate.exists() {
                return Ok(candidate);
            }
        }
        Err(())
    }
}
