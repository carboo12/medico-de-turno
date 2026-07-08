@echo off
title Configurar Firewall para SNC Medic
echo ========================================================
echo   CONFIGURANDO FIREWALL DE WINDOWS (PUERTO 3000)
echo ========================================================
echo.
echo Este script requiere permisos de Administrador.
echo.

echo Intentando crear regla de entrada para el puerto 3000...
echo.
powershell -Command "New-NetFirewallRule -DisplayName 'SNC Medic (Puerto 3000)' -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -Force"

if %errorLevel% equ 0 (
    echo.
    echo [OK] Regla creada exitosamente.
    echo Ahora otros equipos en la red deberian poder acceder al puerto 3000.
) else (
    echo.
    echo [ERROR] No se pudo crear la regla. Es posible que ya exista o que
    echo un software antivirus (como McAfee) este bloqueando la operacion.
)

echo.
pause
