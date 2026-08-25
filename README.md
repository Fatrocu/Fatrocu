# Fatrocu v3.0 - Yerel NaviDC-OCR & Rust Tabanlı Masaüstü Fatura İşleme Uygulaması

<div align="center">

![Fatrocu Banner](https://img.shields.io/badge/Fatrocu-v3.0_Rust-indigo?style=for-the-badge&logo=rust)
![Windows](https://img.shields.io/badge/Platform-Windows-blue?style=for-the-badge&logo=windows)
![Model](https://img.shields.io/badge/AI_Engine-NaviDC--OCR_(1.2B)-emerald?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-orange?style=for-the-badge)

**Bulut bağımlılığı ve pahalı API maliyetleri olmadan; %100 yerel, gizlilik odaklı ve yüksek performanslı masaüstü fatura işleme sistemi.**

</div>

---

## 🌟 Neler Değişti? (v2.x -> v3.0 Rust & NaviDC-OCR)

1. **Bulut API Bağımlılığı Kaldırıldı:** 
   - Google Gemini yerine tamamen yerel çalışan **NaviDC-OCR** (1.2B parametreli hafif Belge VLM'i) entegre edildi.
   - Hiçbir fatura veya veri harici sunuculara gitmez; **%100 veri gizliliği ve sıfır API maliyeti**.
2. **Web'den Yerel Windows Masaüstü Uygulamasına (Rust & Tauri 2.0):**
   - Tarayıcı yerine tek tıklamayla çalışan yerel Windows uygulaması (`.exe`).
   - Rust çekirdeği ile anında başlatma, ultra düşük RAM kullanımı ve yerel dosya sistemi optimizasyonları.
3. **Otomatik PDF -> Yüksek Çözünürlüklü Görsel Dönüştürme:**
   - NaviDC-OCR görseller üzerinden çalıştığı için çok sayfalı PDF'ler ve taramalar Rust çekirdeği tarafından otomatik olarak yüksek çözünürlüklü PNG'lere rasterize edilir.
4. **Gelişmiş Görsel & Poligon (Bounding Box) Arayüzü:**
   - Yakınlaştırma (zoom), kaydırma (pan) ve faturadaki her bir alanın görseldeki koordinatlarını gösteren SVG poligon katmanı.
5. **Yerel SQLite/JSON Depolama & Excel/CSV Çıktısı:**
   - `rust_xlsxwriter` ile yüksek performanslı, biçimlendirilmiş yerel `.xlsx` ve `.csv` dışa aktarımı.

---

## 🚀 Sistem Mimarisi

```
Fatrocu/
├── src-tauri/                     # Rust Tabanlı Çekirdek Motor (Tauri 2.0)
│   ├── src/
│   │   ├── commands.rs            # IPC Komutları (Veri saklama, Excel, OCR köprüsü)
│   │   ├── models.rs              # Fatura, Şablon ve Alan Veri Modelleri
│   │   ├── pdf_converter.rs       # PDF -> Yüksek Çözünürlüklü Görsel Dönüştürücü
│   │   ├── navidc_client.rs       # NaviDC-OCR HTTP İletişim & Yan Süreç Yöneticisi
│   │   ├── excel_export.rs        # Yerel Excel (.xlsx) ve CSV Üretici
│   │   └── storage.rs             # %APPDATA%/Fatrocu Kalıcı Depolama Motoru
│   └── Cargo.toml
├── navidc-engine/                 # Yerel NaviDC-OCR Python Çıkarım Motoru
│   ├── server.py                  # FastAPI / Uvicorn REST API Çıkarım Sunucusu
│   ├── requirements.txt           # Model bağımlılıkları (Torch, Transformers, vLLM)
│   ├── setup_env.bat              # Tek tıkla ortam kurulumu
│   └── start_server.bat           # Motor başlatıcı
├── src/                           # Modern Masaüstü Arayüzü (React 18 + TS + Tailwind)
│   ├── pages/                     # Yükle, Kontrol Et, Onaylananlar, Ayarlar
│   ├── components/                # DocumentViewer (Pan/Zoom/SVG BBox), Kartlar, Header
│   └── services/                  # Tauri IPC Köprüsü
└── .github/workflows/             # Otomatik Windows .exe GitHub Release İş Akışı
```

---

## 🛠️ Kurulum ve Çalıştırma

### 1. Gereksinimler
- **Windows 10 / 11 (64-bit)**
- **Rust & Cargo** (`rustup`)
- **Node.js 18+** ve `npm`
- **Python 3.10+** (NaviDC-OCR motoru için)

### 2. Adım Adım Başlatma

#### A. NaviDC-OCR Motorunun Kurulması:
```cmd
cd navidc-engine
setup_env.bat
start_server.bat
```
*(Sunucu varsayılan olarak `http://127.0.0.1:8765` adresinde çalışır).*

#### B. Fatrocu Masaüstü Uygulamasının Çalıştırılması:
```cmd
# Kök dizinde (Fatrocu/)
npm install
npm run tauri dev
```

#### C. Yayın Sürümü (.exe) Derleme:
```cmd
npm run tauri build
```
Derlenen Windows kurulum dosyası ve çalıştırılabilir `.exe` dosyası `src-tauri/target/release/bundle/` altında oluşturulur.

---

## 📋 Kullanım Kılavuzu

1. **Şablon Seçimi & Dosya Yükleme:**
   - `e-Arşiv Fatura`, `ÖKC/Yazar Kasa Fişi` veya kendi oluşturduğunuz özel şablonu seçin.
   - PDF veya görsel dosyalarınızı sürükleyip bırakın.
2. **Otomatik Çıkarım (NaviDC-OCR):**
   - NaviDC-OCR belgenizi tarar, fatura no, tarih, satıcı, tutar ve KDV detaylarını çıkarır.
3. **Etkileşimli Kontrol (Check Page):**
   - Faturanın önizlemesi üzerinde yakınlaştırma/kaydırma yapın.
   - Form alanlarına tıkladığınızda görseldeki ilgili alan vurgulanır.
   - Yeni alan veya satır kalemi ekleyip çıkartabilirsiniz.
4. **Onaylama & Arşiv:**
   - "Kaydet ve Onayla" veya "Onayla ve Sonrakine Geç" butonuna basın.
5. **Toplu Excel / CSV İndirme:**
   - "Onaylananlar" sekmesinden tek tıkla düzenli `.xlsx` tablosu indirin.

---

## 📄 Lisans
Bu proje **MIT Lisansı** altında sunulmaktadır.
NaviDC-OCR modeli **Apache-2.0** lisansına sahiptir.
