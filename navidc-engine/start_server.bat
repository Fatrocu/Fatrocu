@echo off
echo ============================================================
echo      Fatrocu - NaviDC-OCR Motoru Baslatiliyor...
echo ============================================================
echo.

cd /d "%~dp0"

REM Prefer the venv Python directly (no activation needed, avoids PATH issues)
set PYTHON_EXE=python
if exist ".venv\Scripts\python.exe" (
    set PYTHON_EXE=".venv\Scripts\python.exe"
)

echo [INFO] Kullanilan Python: %PYTHON_EXE%
echo [INFO] Sunucu adresi: http://127.0.0.1:8765
echo.

%PYTHON_EXE% server.py --host 127.0.0.1 --port 8765

if errorlevel 1 (
    echo.
    echo [HATA] Sunucu baslatilirken sorun olustu.
    echo Lutfen once setup_env.bat dosyasini calistirin.
    pause
)
