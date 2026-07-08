@echo off
setlocal
cd /d "%~dp0"
cd ..
title SNC Medic - Reiniciar Aplicacion

echo Reiniciando SNC Medic con PM2...
call pm2 reload ecosystem.config.cjs
call pm2 save --force

echo.
echo Reinicio completado.
pause
