@echo off
title Sunny Thakur Portfolio - Live Public Link
echo ==============================================
echo   Starting Sunny Thakur Portfolio Live Server...
echo ==============================================
start /B powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1" -Port 8080
timeout /t 2 >nul
echo Starting Cloudflare Public Tunnel...
"%~dp0cloudflared.exe" tunnel --http-host-header "localhost:8080" --url http://localhost:8080
pause
