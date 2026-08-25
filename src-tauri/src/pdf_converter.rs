use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use image::ImageFormat;
use std::fs;
use std::io::Cursor;
use std::path::Path;
use std::process::Command;

pub struct DocumentProcessor;

impl DocumentProcessor {
    /// Loads an image or converts a PDF into high-res PNG bytes and Base64 string (300 DPI)
    pub fn process_file_to_image(file_path: &Path) -> Result<(Vec<u8>, String, String), String> {
        let extension = file_path
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("")
            .to_lowercase();

        match extension.as_str() {
            "png" | "jpg" | "jpeg" | "webp" | "bmp" | "tiff" | "tif" => {
                let bytes = fs::read(file_path).map_err(|e| format!("Dosya okunamadı: {}", e))?;
                // Load and normalize image
                let img = image::load_from_memory(&bytes)
                    .map_err(|e| format!("Görsel yüklenemedi: {}", e))?;

                let mut out_bytes = Vec::new();
                img.write_to(&mut Cursor::new(&mut out_bytes), ImageFormat::Png)
                    .map_err(|e| format!("Görsel formatlanamadı: {}", e))?;

                let b64 = BASE64.encode(&out_bytes);
                let data_url = format!("data:image/png;base64,{}", b64);
                Ok((out_bytes, b64, data_url))
            }
            "pdf" => {
                // High-resolution 300 DPI rasterization (with multi-page support)
                let (png_bytes, b64) = Self::rasterize_pdf_high_res(file_path)?;
                let data_url = format!("data:image/png;base64,{}", b64);
                Ok((png_bytes, b64, data_url))
            }
            _ => Err(format!("Desteklenmeyen dosya formatı: .{}", extension)),
        }
    }

    /// Converts raw bytes (e.g. uploaded from frontend) to high-res image Base64 and data URL
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
            // Write temp PDF and rasterize at 300 DPI
            let temp_pdf_path =
                std::env::temp_dir().join(format!("fatrocu_highres_{}.pdf", uuid::Uuid::new_v4()));
            fs::write(&temp_pdf_path, file_bytes).map_err(|e| e.to_string())?;
            let res = Self::rasterize_pdf_high_res(&temp_pdf_path);
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

    /// High-resolution PDF Rasterizer (300 DPI, multi-page vertical stitch, white background)
    fn rasterize_pdf_high_res(pdf_path: &Path) -> Result<(Vec<u8>, String), String> {
        let script = format!(
            r#"
import sys
import io
from pathlib import Path
from PIL import Image

pdf_file = r"{path}"
rendered_images = []

# Engine 1: PyMuPDF (fitz) - 300 DPI ultra-crisp rasterization
try:
    import fitz
    doc = fitz.open(pdf_file)
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        # 300 DPI resolution (matrix 300/72 = ~4.16x standard scale)
        zoom = 300.0 / 72.0
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        rendered_images.append(img)
        # Limit to max 4 pages for memory safety if huge document
        if len(rendered_images) >= 4:
            break
except Exception as e1:
    rendered_images = []
    # Engine 2 Fallback: pypdfium2
    try:
        import pypdfium2 as pdfium
        pdf = pdfium.PdfDocument(pdf_file)
        for page_idx in range(len(pdf)):
            page = pdf[page_idx]
            # scale=4.0 for high resolution ~300 DPI
            bitmap = page.render(scale=3.5)
            pil_img = bitmap.to_pil().convert("RGB")
            rendered_images.append(pil_img)
            if len(rendered_images) >= 4:
                break
    except Exception as e2:
        sys.stderr.write(f"PDF Rasterizer error: fitz ({{e1}}), pdfium ({{e2}})")
        sys.exit(1)

if not rendered_images:
    sys.stderr.write("No pages could be rendered from PDF.")
    sys.exit(1)

# Stitch multiple pages vertically if multi-page invoice
if len(rendered_images) == 1:
    final_image = rendered_images[0]
else:
    max_w = max(img.width for img in rendered_images)
    total_h = sum(img.height for img in rendered_images) + (len(rendered_images) - 1) * 20
    final_image = Image.new("RGB", (max_w, total_h), (240, 240, 245))
    
    current_y = 0
    for img in rendered_images:
        offset_x = (max_w - img.width) // 2
        final_image.paste(img, (offset_x, current_y))
        current_y += img.height + 20

# Save high-res PNG into output buffer
buf = io.BytesIO()
final_image.save(buf, format="PNG", optimize=True)
sys.stdout.buffer.write(buf.getvalue())
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
            return Err(format!("PDF 300 DPI dönüştürme hatası: {}", err_msg));
        }

        let png_bytes = output.stdout;
        if png_bytes.is_empty() {
            return Err("PDF'den yüksek çözünürlüklü görsel verisi çıkarılamadı.".to_string());
        }

        let b64 = BASE64.encode(&png_bytes);
        Ok((png_bytes, b64))
    }
}
