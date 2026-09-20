# ✦ FATROCU v3.0

<div align="center">

```
  ___  ____  ____  ____  ____  ___  _  _
 / __)( ___)( ___)( ___)(  _ \/ _ \/ )( \
 \__ \ )__)  )__)  )__)  )   ( (_) ) \/ (
 (___/(____)(____)(____)(_)\_)\___/ \____/

     ★  AKILLI FATURA İŞLEME SİSTEMİ  ★
```

[![Release](https://img.shields.io/github/v/release/Nec0ti/Fatrocu?style=for-the-badge&color=000000&labelColor=ffffff&label=v3.0)](https://github.com/Nec0ti/Fatrocu/releases)
[![Platform](https://img.shields.io/badge/Windows-x64-000000?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/Nec0ti/Fatrocu/releases)
[![Rust](https://img.shields.io/badge/Rust-Tauri_2.0-000000?style=for-the-badge&logo=rust&logoColor=white)](https://tauri.app)
[![License](https://img.shields.io/badge/License-MIT-000000?style=for-the-badge)](LICENSE)
[![Docs](https://img.shields.io/badge/Docs-GitHub_Pages-000000?style=for-the-badge)](https://nec0ti.github.io/Fatrocu)

**%100 yerel · Bulut yok · API maliyeti yok · Veri gizliliği tam**

[📦 İndir](https://github.com/Nec0ti/Fatrocu/releases/latest) · [📚 Dokümantasyon](https://nec0ti.github.io/Fatrocu) · [🐛 Hata Bildir](https://github.com/Nec0ti/Fatrocu/issues)

</div>

---

## ✦ Nedir?

**Fatrocu**, faturalarınızı yapay zeka ile otomatik olarak işleyen, tamamen yerel çalışan bir Windows masaüstü uygulamasıdır.

- **PDF ve görüntü faturalarını** okur
- **Tüm alanları otomatik çıkarır** (fatura no, tarih, VKN, KDV, toplam tutar…)
- **Excel ve CSV** olarak dışa aktarır
- **Hiçbir veri** internete gitmez — her şey bilgisayarınızda kalır

```
┌─────────────────────────────────────────────────┐
│  PDF/PNG Fatura                                  │
│       ↓                                          │
│  DeepSeek-OCR (GGUF) ── görüntü → markdown      │
│       ↓                                          │
│  Gemma 4 (GGUF) ────── markdown → JSON alanlar  │
│       ↓                                          │
│  Excel / CSV Dışa Aktarım                        │
└─────────────────────────────────────────────────┘
```

---

## ✦ Kurulum

### 1. Installer ile (Önerilen)

[**Releases sayfasından**](https://github.com/Nec0ti/Fatrocu/releases/latest) en son sürümü indirin:

| Dosya | Açıklama |
|---|---|
| `Fatrocu_3.0.0_x64-setup.exe` | NSIS kurulum sihirbazı |
| `Fatrocu_3.0.0_x64_en-US.msi` | MSI paketi |
| `fatrocu.exe` | Taşınabilir (kurulum gerektirmez) |

### 2. Model Kurulumu

Fatrocu çalışmak için iki GGUF modeline ihtiyaç duyar:

#### Yöntem A — Sürükle & Bırak (Kolay) ✓
1. Uygulamayı açın → **Ayarlar** sekmesine gidin
2. Model dosyalarını (`*.gguf`) **"Model Sürükle-Bırak"** alanına bırakın
3. Program modeli otomatik tanır ve yapılandırır

#### Yöntem B — Klasöre Yerleştir
Model dosyalarını uygulama dizinindeki `gguf/` klasörüne koyun:
```
Fatrocu/
└── gguf/
    ├── DeepSeek-OCR.Q6_K.gguf     ← OCR modeli
    └── gemma-4-E4B-it-IQ4_XS.gguf ← Alan çıkarma modeli
```

#### Yöntem C — Tek Tıkla llama.cpp Kur
Ayarlar → **"Motoru Tek Tıkla Kur"** butonu → llama-cli otomatik indirilir

#### Model İndirme Linkleri

| Model | Amaç | İndirme |
|---|---|---|
| `NexaAI/DeepSeek-OCR-GGUF` | OCR — Görüntü → Metin | [HuggingFace →](https://huggingface.co/NexaAI/DeepSeek-OCR-GGUF) |
| `unsloth/gemma-4-E4B-it-GGUF` | Alan Çıkarma (Önerilen) | [HuggingFace →](https://huggingface.co/unsloth/gemma-4-E4B-it-GGUF) |
| `unsloth/gemma-4-E2B-it-GGUF` | Hafif (Düşük RAM) | [HuggingFace →](https://huggingface.co/unsloth/gemma-4-E2B-it-GGUF) |

---

## ✦ Kullanım

```
1. Fatrocu'yu açın
2. Fatura PDF/PNG dosyalarını sürükleyin veya "Fatura Yükle" butonunu kullanın
3. AI pipeline otomatik işler (OCR → Alan çıkarma)
4. İnceleme ekranında alanları doğrulayın / düzenleyin
5. "Onayla" → Excel veya CSV olarak dışa aktarın
```

### Fatura Şablonları

Farklı firma formatları için şablon oluşturabilirsiniz:

1. **Ayarlar → Fatura Şablonları** sekmesine gidin
2. **"+ Yeni Şablon"** butonuna tıklayın
3. Çıkarmak istediğiniz alanları ekleyin (örn: `siparis_no`, `kdv_orani`)
4. Şablonu kaydedin
5. Fatura yüklerken şablonu seçin

---

## ✦ Derleme (Kaynak Koddan)

### Gereksinimler

| Araç | Sürüm |
|---|---|
| Rust | 1.75+ |
| Node.js | 18+ |
| Python | 3.10+ |

```powershell
# Repoyu klonla
git clone https://github.com/Nec0ti/Fatrocu.git
cd Fatrocu

# Bağımlılıkları kur
npm install

# Geliştirme modu (hot-reload)
npm run tauri dev

# Dağıtım build (exe + MSI + NSIS)
npm run tauri build
# Çıktılar: src-tauri/target/release/bundle/
```

---

## ✦ Mimari

```
src/                    ← React + TypeScript frontend
  pages/
    UploadPage.tsx      ← Fatura yükleme ekranı
    ReviewPage.tsx      ← İnceleme ve onay ekranı
    SettingsPage.tsx    ← Model ve şablon yönetimi
  services/
    tauriService.ts     ← Rust ↔ Frontend köprüsü

src-tauri/src/          ← Rust backend
  llama_engine.rs       ← DeepSeek-OCR + Gemma 4 pipeline
  commands.rs           ← Tauri IPC komutları
  storage.rs            ← JSON tabanlı yerel depolama
  pdf_converter.rs      ← PDF → PNG dönüştürücü
  models.rs             ← Veri modelleri
```

---

## ✦ Sık Karşılaşılan Sorunlar

| Sorun | Çözüm |
|---|---|
| `llama-cli bulunamadı` | Ayarlar → "Motoru Tek Tıkla Kur" ya da llama.cpp'yi PATH'e ekle |
| `Model dosyası bulunamadı` | GGUF dosyasını `gguf/` klasörüne koy veya sürükle-bırak kullan |
| PDF sayfaları işlenmiyor | Python 3 yüklü olduğundan emin ol (`python --version`) |
| Yavaş işleme | Ayarlar'dan thread sayısını artır; GPU katmanı ekle (varsa) |
| OCR hatalı sonuç | Daha yüksek kalite GGUF dosyası kullan (Q6_K önerilir) |

---

## ✦ Lisans

MIT — Bkz: [LICENSE](LICENSE)

---

<div align="center">

**Fatrocu v3.0** · Rust + Tauri 2.0 · llama.cpp · DeepSeek-OCR · Gemma 4

*Made with ♥ — %100 Yerel, %100 Gizli*

[nec0ti.github.io/Fatrocu](https://nec0ti.github.io/Fatrocu)

</div>
