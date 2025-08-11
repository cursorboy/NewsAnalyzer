@echo off
echo Fixing Vite installation and starting frontend...
echo.

echo Step 1: Cleaning up corrupted files...
if exist node_modules\.vite-temp rmdir /s /q node_modules\.vite-temp
if exist backend rmdir /s /q backend
taskkill /f /im node.exe >nul 2>&1

echo Step 2: Clearing npm cache...
npm cache clean --force

echo Step 3: Installing dependencies...
npm install

echo Step 4: Starting development server...
echo If this fails, we'll try the fallback server...
npm run dev

pause
