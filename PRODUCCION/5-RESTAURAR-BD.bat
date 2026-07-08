@echo off
TITLE Restauracion de Base de Datos
echo ¡ADVERTENCIA! Se restaurara el respaldo mas reciente.
echo Esto sobrescribira los datos actuales.
pause
echo [INFO] Deteniendo app para evitar bloqueo de archivos...
cd /d "%~dp0.."
pm2 stop snc-medic
echo [INFO] Restaurando...
call npm run restore
echo [INFO] Iniciando app de nuevo...
pm2 start snc-medic
echo [OK] Restauracion completada.
pause
