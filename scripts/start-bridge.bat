@echo off
REM ============================================================================
REM  Antigravity Remote - Bridge launcher
REM  Starts the HTTP + WebSocket bridge on port 5000 (127.0.0.1 loopback only).
REM  Tailscale Serve terminates TLS and forwards to 127.0.0.1:5000.
REM  Leave this window open; close it to stop the bridge.
REM ============================================================================
title Antigravity Remote Bridge
cd /d "%~dp0.."

echo.
echo   Starting Antigravity Remote bridge on http://127.0.0.1:5000
echo   Remote access via Tailscale Serve reverse proxy
echo   (Keep this window open. Close it to stop the bridge.)
echo.

node src\http-server.mjs

echo.
echo   Bridge stopped.
REM When launched by desktop-helper.exe (MOBILE_SUPERVISED=1) skip the pause so
REM the helper can detect the exit and relaunch. Manual double-click still pauses.
if "%MOBILE_SUPERVISED%"=="1" exit /b
echo   Press any key to close.
pause >nul
