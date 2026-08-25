@echo off
echo ============================================================
echo      Fatrocu - NaviDC-OCR Motoru Baslatiliyor...
echo ============================================================
echo.

cd /d "%~dp0"

if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
)

python server.py --host 127.0.0.1 --port 8765

if errorlevel 1 (
    echo.
    echo [BILGI] Python bagimliliklari eksik olabilir.
    echo Lutfen once setup_env.bat dosyasini calistirin.
    pause
)
