# Fatrocu System Architecture & Pipeline

```mermaid
flowchart TD
    subgraph UI ["Desktop UI (React + Tailwind + Lucide)"]
        Upload[Upload Page: Drag & Drop / Queue]
        Review[Check & Review Page: Pan/Zoom & SVG BBox]
        Approved[Archive Page: Search / Excel Export]
        Settings[Settings: Templates & Engine Config]
    end

    subgraph RustCore ["Rust Core (Tauri 2.0)"]
        IPC[IPC Command Handlers]
        PDFRasterizer[PDF to Image Rasterizer]
        DiskStorage[Disk Storage]
        ExcelEngine[Native Excel & CSV Generator]
        SidecarManager[NaviDC-OCR Client & Sidecar Controller]
    end

    subgraph VLM ["Local AI Engine (NaviDC-OCR)"]
        FastAPIServer[FastAPI REST Server]
        VLMModel[StarDoc-AI/NaviDC-OCR 1.2B VLM]
        BBoxMapper[Grounded Coordinate Normalizer]
    end

    Upload -->|File Bytes + Template Config| IPC
    IPC --> PDFRasterizer
    PDFRasterizer -->|High-Res PNG Image| SidecarManager
    SidecarManager -->|REST /extract| FastAPIServer
    FastAPIServer --> VLMModel
    VLMModel --> BBoxMapper
    BBoxMapper --> FastAPIServer
    FastAPIServer -->|Structured Fields + Polygons| SidecarManager
    SidecarManager --> DiskStorage
    DiskStorage --> Review
    Review -->|Save & Approve| DiskStorage
    Approved -->|Export Request| ExcelEngine
    ExcelEngine -->|Saves .xlsx / .csv| DiskStorage
```

### Key Technical Specs:
- **Vision-Language Model**: `StarDoc-AI/NaviDC-OCR` (1.2B lightweight model based on Qwen2.5-VL architecture).
- **Desktop Runtime**: Tauri 2.0 on Windows (`WebView2` + Rust native backend).
- **Persistence**: JSON / binary cache in `%APPDATA%\Fatrocu`.
- **Excel Output**: Direct XLSX binary output via `rust_xlsxwriter` (no Excel/Office dependency).
