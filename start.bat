@echo off
echo 🎨 Starting Images Shuffler Server...

rem Kill any existing Node.js processes (Windows)
taskkill /F /IM node.exe >nul 2>&1

rem Wait a moment for cleanup
timeout /t 1 >nul

rem Start the server
node server.js

pause