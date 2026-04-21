#!/bin/bash
# Double-click this file on macOS to start the CRM.
# This script runs in the folder where it lives.

set -e
cd "$(dirname "$0")"

# Make ourselves executable on first run (in case zip-extract stripped the +x bit)
chmod +x "$0" 2>/dev/null || true

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
  cat <<'MSG'

  ✖  No se encontró Node.js en tu computadora.

     Para usar el CRM necesitas instalar Node.js versión 20 o superior.
     Se va a abrir la página de descarga ahora.

     Después de instalar Node.js, vuelve a hacer doble click en este
     archivo ("Iniciar CRM.command") para arrancar el CRM.

MSG
  if command -v osascript >/dev/null 2>&1; then
    osascript -e 'display dialog "Primero necesitas instalar Node.js para usar el CRM.\n\nVoy a abrir la página de descarga.\n\nUna vez instalado, vuelve a abrir \"Iniciar CRM.command\"." buttons {"Entendido"} default button 1 with icon caution with title "CRM Local"' >/dev/null 2>&1 || true
  fi
  open "https://nodejs.org/es/download" 2>/dev/null || true
  echo
  read -n 1 -s -r -p "Pulsa cualquier tecla para cerrar esta ventana…"
  exit 1
fi

exec node scripts/start.mjs
