@echo off
setlocal
cd /d "%~dp0"
cd ..
title SNC Medic - Despliegue a Produccion

echo ========================================================
echo   SNC MEDIC - DESPLIEGUE AUTOMATICO
echo ========================================================
echo.

:: 1. Instalar Dependencias
echo [1/5] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] al instalar dependencias.
    pause
    exit /b %errorlevel%
)

:: 2. Generar Prisma Client + Sync DB schema
echo.
echo [2/5] Sincronizando Base de Datos (Prisma)...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] al generar Prisma Client.
    pause
    exit /b %errorlevel%
)
call npx prisma db push --accept-data-loss
if %errorlevel% neq 0 (
    echo [ERROR] al sincronizar la base de datos.
    pause
    exit /b %errorlevel%
)
echo [OK] Base de datos sincronizada correctamente.

:: 3. Compilar Aplicacion
echo.
echo [3/5] Compilando aplicacion (Build)...
echo Esto puede tardar unos minutos...
call npm run build
if %errorlevel% neq 0 (
    echo [WARNING] Error durante el build. Limpiando cache y reintentando...
    if exist .next rmdir /s /q .next
    call npm run build
    if %errorlevel% neq 0 (
        echo [FATAL] Error en el build. Revise los logs.
        pause
        exit /b %errorlevel%
    )
)

:: 4. Verificar/Instalar PM2
echo.
echo [4/5] Verificando Gestor de Procesos (PM2)...
call pm2 -v >nul 2>&1
if %errorlevel% neq 0 (
    echo PM2 no encontrado. Instalando PM2 globalmente...
    call npm install -g pm2
) else (
    echo PM2 ya esta instalado.
)

:: 5. Iniciar/Recargando aplicacion
echo.
echo [5/5] Iniciando/Recargando aplicacion...

call pm2 describe snc-medic >nul 2>&1
if %errorlevel% equ 0 (
    echo La aplicacion ya esta corriendo. Recargando...
    call pm2 reload ecosystem.config.cjs
) else (
    echo Iniciando aplicacion por primera vez...
    call pm2 start ecosystem.config.cjs
)

call pm2 save --force

echo.
echo   DESPLIEGUE COMPLETADO EXITOSAMENTE
echo ========================================================
echo.
echo La aplicacion ya es accesible desde esta red:
echo.
echo   - En esta PC:  http://localhost:3000
echo   - En la RED:   http://[TU_IP_LOCAL]:3000
echo.
echo Direcciones IP detectadas en este equipo:
ipconfig | findstr /c:"IPv4"
echo.
pause
