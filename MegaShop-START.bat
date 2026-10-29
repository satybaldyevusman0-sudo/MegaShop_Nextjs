@echo off
chcp 65001 >nul
cd /d "%~dp0"
title MegaShop

where node >nul 2>nul
if errorlevel 1 goto nonode

if exist node_modules\next goto run
echo.
echo  MegaShop: биринчи жолу керектүү пакеттер орнотулууда, 1-3 мүнөт күтүңүз...
echo.
call npm install
if errorlevel 1 goto failed

:run
echo.
echo  MegaShop иштеп жатат: http://localhost:3000
echo  Браузер өзү ачылат. Сайтты жабуу үчүн бул терезени жабыңыз.
echo.
start "" cmd /c "timeout /t 10 >nul & start http://localhost:3000"
call npm run dev
pause
exit /b 0

:nonode
echo.
echo  Node.js орнотулган эмес.
echo  Ачылган барактан "LTS" версиясын жүктөп орнотуңуз, андан кийин бул файлды кайра ачыңыз.
echo.
start https://nodejs.org/
pause
exit /b 1

:failed
echo.
echo  Пакеттерди орното алган жок. Интернетти текшерип, кайра ачыңыз.
echo.
pause
exit /b 1
