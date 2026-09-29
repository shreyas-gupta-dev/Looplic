@echo off
title Looplic - Side by Side Launcher
echo ========================================================
echo   Starting all Looplic apps (User, Admin, Tech, Operator)
echo ========================================================
start "Looplic Dev Servers" cmd /k "npm run dev"
echo Waiting 4 seconds for servers to initialize...
timeout /t 4 /nobreak >nul
echo Opening Side-by-Side view in browser...
start "" "%~dp0side-by-side.html"
echo Done!
