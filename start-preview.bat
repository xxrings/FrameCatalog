@echo off
setlocal
cd /d "%~dp0"
echo Starting Frame Catalog preview...
echo.
echo Open http://127.0.0.1:4173 in your browser.
echo Keep this window open while previewing. Press Ctrl+C to stop.
echo.
"C:\Program Files\nodejs\node.exe" preview-server.js
