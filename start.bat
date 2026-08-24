@echo off
REM ============================================================
REM  Job Getter — one-click launcher
REM  Starts the Flask API + serves the built frontend on :5000
REM ============================================================
title Job Getter Server
cd /d "%~dp0backend"

echo.
echo   [Job Getter] Starting on http://127.0.0.1:5000
echo.

"C:\Users\yoga\AppData\Local\Programs\Python\Python313\python.exe" server.py

pause
