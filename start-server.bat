@echo off
title Sunny Thakur Portfolio - Local Server
echo ==============================================
echo   Starting Sunny Thakur Portfolio Server...
echo ==============================================
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1" -Port 8080
pause
