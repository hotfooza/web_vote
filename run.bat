@echo off
title Voting System Server
echo ===================================================
echo   Starting Voting System Server...
echo ===================================================
cd /d "%~dp0"
node server.js
pause
