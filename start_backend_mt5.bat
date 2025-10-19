@echo off
cls
echo ========================================
echo  MT5 BACKEND ЭХЛҮҮЛЖ БАЙНА
echo ========================================
echo.

cd /d C:\Users\mmdor\Desktop\Forex_signal_app\backend

echo Backend directory: %CD%
echo.

echo MT5 тохиргоо шалгаж байна...
findstr "MT5_ENABLED=True" config\.env >nul
if %errorlevel%==0 (
    echo [OK] MT5_ENABLED=True
) else (
    echo [!] MT5_ENABLED=False
)
echo.

echo ========================================
echo  Backend эхэлж байна...
echo ========================================
echo.
echo Зогсоох: CTRL+C
echo.

C:\Users\mmdor\Desktop\Forex_signal_app\.venv\Scripts\python.exe app.py

pause
