@echo off
REM ============================================================================
REM  Antigravity Remote — Tailscale Serve Setup Helper (Phase 04)
REM  Configures Tailscale Serve to expose the loopback bridge (127.0.0.1:5000)
REM  securely over Tailscale MagicDNS with valid TLS termination.
REM ============================================================================

echo ============================================================================
echo   Antigravity Remote — Tailscale Serve Setup
echo ============================================================================
echo.

REM 1. Check if Tailscale CLI is available
where tailscale >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Tailscale CLI is not installed or not in PATH.
    echo Please install Tailscale from https://tailscale.com/download/windows
    echo and ensure 'tailscale' is accessible in your command prompt.
    echo.
    pause
    exit /b 1
)

echo [*] Checking Tailscale status...
tailscale status
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Tailscale is not running or logged in.
    echo Please start Tailscale and log in.
    echo.
    pause
    exit /b 1
)

echo.
echo [*] Configuring Tailscale Serve reverse proxy...
echo     Forwarding HTTPS traffic to http://127.0.0.1:5000
tailscale serve --bg 5000 127.0.0.1:5000

echo.
echo [*] Current Tailscale Serve Status:
tailscale serve status

echo.
echo ============================================================================
echo [SUCCESS] Tailscale Serve is configured!
echo Use your laptop's MagicDNS name or 100.x.y.z IP in the Antigravity Android app.
echo ============================================================================
echo.
pause
