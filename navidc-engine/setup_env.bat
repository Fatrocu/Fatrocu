@echo off
echo ============================================================
echo      Fatrocu - NaviDC-OCR Kurulum ve Ortam Hazirlayici
echo ============================================================
echo.

cd /d "%~dp0"

if not exist ".venv" (
    echo [1/3] Python sanal ortami (.venv) olusturuluyor...
    python -m venv .venv
    if errorlevel 1 (
        echo [HATA] Python sanal ortami olusturulamadi! Python 3.10+ yuklu oldugundan emin olun.
        pause
        exit /b 1
    )
)

echo [2/3] Sanal ortam etkinlestiriliyor...
call .venv\Scripts\activate.bat

echo [3/3] NaviDC-OCR bagimliliklari yukleniyor...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

echo.
echo ============================================================
echo      Kurulum Basariyla Tamamlandi!
echo      Sunucuyu baslatmak icin start_server.bat calistirabilirsiniz.
echo ============================================================
echo.
pause
