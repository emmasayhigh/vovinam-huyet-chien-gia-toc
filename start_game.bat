@echo off
chcp 65001 >nul
title VOVINAM - SÁT THẦN GIẢI CỨU HỨA VŨ ĐẠI
cd /d "%~dp0"

echo ========================================================
echo    VOVINAM: SÁT THẦN GIẢI CỨU HỨA VŨ ĐẠI
echo ========================================================
echo Đang kiểm tra môi trường và khởi động game...
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [CẢNH BÁO] Không tìm thấy Node.js trong hệ thống PATH!
    echo Đang mở trực tiếp index.html bằng trình duyệt mặc định...
    start "" "%~dp0index.html"
    pause
    exit /b
)

:: Mở trình duyệt sau 1.5 giây khi server đã sẵn sàng
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000/"

echo Local server đang chạy tại: http://localhost:3000/
echo Trình duyệt sẽ tự động mở sau giây lát.
echo.
echo [LƯU Ý] Đừng tắt cửa sổ này khi đang chơi để giữ kết nối server.
echo Khi muốn tắt game hoàn toàn, chỉ cần đóng cửa sổ này.
echo ========================================================
echo.

node server.js
