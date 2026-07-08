@echo off
TITLE Gestión de APP - SNC Medic
echo [INFO] Deteniendo aplicacion...
cd /d "%~dp0.."
pm2 stop snc-medic
pm2 save
echo [OK] Aplicacion detenida y removida del inicio automatico.
pause
