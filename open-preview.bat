@echo off
setlocal
cd /d "%~dp0"
start "Frame Catalog Preview Server" cmd /k ""C:\Program Files\nodejs\node.exe" preview-server.js"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:4173"
