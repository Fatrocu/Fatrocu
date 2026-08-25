# Fatrocu - Nasıl Çalıştırılır ve Dağıtılır?

Bu kılavuz, Fatrocu masaüstü uygulamasını geliştirme modunda çalıştırma, yerel yapay zeka motorunu kurma ve GitHub / Windows için yayın derlemesi (.exe) oluşturma adımlarını açıklar.

---

## 1. İlk Kurulum

### A. Python & NaviDC-OCR Motoru Kurulumu
1. `navidc-engine` klasörüne gidin.
2. `setup_env.bat` dosyasını çalıştırın (veya manuel olarak `python -m venv .venv` ve `pip install -r requirements.txt`).
3. `start_server.bat` dosyasını çalıştırarak yerel sunucuyu (`http://127.0.0.1:8765`) başlatın.

### B. Masaüstü Uygulaması Bağımlılıkları
Ana proje dizininde terminali açın:
```bash
npm install
```

---

## 2. Geliştirme Modunda Çalıştırma (Dev Mode)

Aşağıdaki komutu çalıştırarak masaüstü uygulamasını canlı yeniden yükleme (hot-reload) ile başlatabilirsiniz:
```bash
npm run tauri dev
```

---

## 3. Windows İçin Yayın Sürümü Derleme (Release .EXE)

Tüm optimizasyonlar yapılmış, bağımsız çalışan Windows `.exe` ve kurulum paketini (NSIS/MSI) üretmek için:

```bash
npm run tauri build
```

Derlenen dosyalar:
- **Taşınabilir / Kurulum Dosyaları:** `src-tauri/target/release/bundle/nsis/Fatrocu_3.0.0_x64-setup.exe`
- **Bağımsız Çalıştırılabilir (.exe):** `src-tauri/target/release/fatrocu.exe`

---

## 4. GitHub Release Yayınlama

Projeye yeni bir etiket (`tag`) atıp gönderdiğinizde, GitHub Actions iş akışı (`.github/workflows/release.yml`) otomatik olarak Windows için derleme yapacak ve GitHub Releases sayfasına `.exe` ve `.msi` yükleyecektir:

```bash
git add .
git commit -m "feat: release v3.0.0"
git tag v3.0.0
git push origin main --tags
```
