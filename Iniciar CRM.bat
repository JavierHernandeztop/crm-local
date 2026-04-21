@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo.
  echo   [X] No se encontro Node.js en tu computadora.
  echo.
  echo   Para usar el CRM necesitas instalar Node.js version 20 o superior.
  echo   Voy a abrir la pagina de descarga ahora.
  echo.
  echo   Despues de instalar Node.js, vuelve a hacer doble click en
  echo   "Iniciar CRM.bat" para arrancar el CRM.
  echo.
  start "" "https://nodejs.org/es/download"
  echo.
  pause
  exit /b 1
)

node scripts\start.mjs
if %errorlevel% neq 0 (
  echo.
  echo Hubo un error. Pulsa una tecla para cerrar.
  pause >nul
)
