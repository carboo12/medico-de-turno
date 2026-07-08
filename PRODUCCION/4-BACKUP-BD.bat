@echo off
TITLE Respaldo de Base de Datos
echo [INFO] Iniciando respaldo...
cd /d "%~dp0.."
call npm run backup
echo [OK] Respaldo finalizado.
pause
