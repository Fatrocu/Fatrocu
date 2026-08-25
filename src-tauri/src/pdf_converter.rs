use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use image::ImageFormat;
use std::fs;
use std::io::Cursor;
use std::path::Path;
use std::process::Command;

pub struct DocumentProcessor;

impl DocumentProcessor {
    /// Loads an image or converts the first page of a PDF into high-res PNG bytes and Base64 string
    pub fn process_file_to_image(file_path: &Path) -> Result<(Vec<u8>, String, String), String> {
        let extension = file_path
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("")
            .to_lowercase();

        match extension.as_str() {
            "png" | "jpg" | "jpeg" | "webp" | "bmp" => {
                let bytes = fs::read(file_path).map_err(|e| format!("Dosya okunamadı: {}", e))?;
                let mime = match extension.as_str() {
                    "png" => "image/png",
                    "jpg" | "jpeg" => "image/jpeg",
                    "webp" => "image/webp",
                    "bmp" => "image/bmp",
                    _ => "image/png",
                };
                let b64 = BASE64.encode(&bytes);
                let data_url = format!("data:{};base64,{}", mime, b64);
                Ok((bytes, b64, data_url))
            }
            "pdf" => {
                // Rasterize PDF using python pypdfium2/pymupdf or built-in CLI
                let (png_bytes, b64) = Self::rasterize_pdf_first_page(file_path)?;
                let data_url = format!("data:image/png;base64,{}", b64);
                Ok((png_bytes, b64, data_url))
            }
            _ => Err(format!("Desteklenmeyen dosya formatı: .{}", extension)),
        }
    }

    /// Converts raw bytes (e.g. uploaded from frontend) to image Base64 and data URL
    pub fn process_bytes_to_image(
        file_bytes: &[u8],
        file_name: &str,
    ) -> Result<(Vec<u8>, String, String), String> {
        let extension = Path::new(file_name)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("")
            .to_lowercase();

        if extension == "pdf" {
            // Write temp PDF and rasterize
            let temp_pdf_path = std::env::temp_dir().join(format!("fatrocu_temp_{}.pdf", uuid::Uuid::new_v4()));
            fs::write(&temp_pdf_path, file_bytes).map_err(|e| e.to_string())?;
            let res = Self::rasterize_pdf_first_page(&temp_pdf_path);
            let _ = fs::remove_file(&temp_pdf_path);
            let (png_bytes, b64) = res?;
            let data_url = format!("data:image/png;base64,{}", b64);
            Ok((png_bytes, b64, data_url))
        } else {
            // Validate & optimize image with `image` crate
            let img = image::load_from_memory(file_bytes)
                .map_err(|e| format!("Görsel yüklenemedi: {}", e))?;
            
            let mut out_bytes = Vec::new();
            img.write_to(&mut Cursor::new(&mut out_bytes), ImageFormat::Png)
                .map_err(|e| format!("Görsel dönüştürme hatası: {}", e))?;

            let b64 = BASE64.encode(&out_bytes);
            let data_url = format!("data:image/png;base64,{}", b64);
            Ok((out_bytes, b64, data_url))
        }
    }

    fn rasterize_pdf_first_page(pdf_path: &Path) -> Result<(Vec<u8>, String), String> {
        let script = format!(
            r#"
import sys
from pathlib import Path
try:
    import pypdfium2 as pdfium
    pdf = pdfium.PdfDocument(r"{path}")
    page = pdf[0]
    bitmap = page.render(scale=2.0)
    pil_image = bitmap.to_pil()
    import io
    buf = io.BytesIO()
    pil_image.save(buf, format="PNG")
    sys.stdout.buffer.write(buf.getvalue())
except Exception as e:
    try:
        import fitz
        doc = fitz.open(r"{path}")
        page = doc[0]
        pix = page.get_pixmap(dpi=200)
        sys.stdout.buffer.write(pix.tobytes("png"))
    except Exception as e2:
        sys.stderr.write(f"PDF Rasterizer error: {{e}} / {{e2}}")
        sys.exit(1)
"#,
            path = pdf_path.to_string_lossy().replace('\\', "/")
        );

        let output = Command::new("python")
            .arg("-c")
            .arg(&script)
            .output()
            .map_err(|e| format!("Python PDF dönüştürücü çalıştırılamadı: {}", e))?;

        if !output.status.success() {
            let err_msg = String::from_utf8_lossy(&output.stderr);
            return Err(format!("PDF sayfasına dönüştürme hatası: {}", err_msg));
        }

        let png_bytes = output.stdout;
        if png_bytes.is_empty() {
            return Err("PDF'den görsel verisi çıkarılamadı.".to_string());
        }

        let b64 = BASE64.encode(&png_bytes);
        Ok((png_bytes, b64))
    }
}
