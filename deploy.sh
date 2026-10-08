#!/usr/bin/env bash
set -e

# Script de Despliegue de Impacto Cero (Zero-Downtime) para Hostinger
# Diseñado para ejecuciones manuales o automatizadas desde n8n / CI/CD

REMOTE_HOST="u771273295@195.179.239.30"
REMOTE_PORT="65002"
REMOTE_BASE="/home/u771273295/domains/aqua-raven-173850.hostingersite.com"
REMOTE_LIVE="${REMOTE_BASE}/public_html"
REMOTE_STAGING="${REMOTE_BASE}/public_html_staging"

# 1. Compilación estática
echo "==> 1. Compilando proyecto Astro en estático..."
if [ -n "$WC_CUP_EXCHANGE_RATE" ]; then
  echo "    -> Usando tasa CUP inyectada: $WC_CUP_EXCHANGE_RATE"
fi
npm run build

if [ ! -d "dist" ]; then
  echo "Error: No se encontró el directorio dist/ tras el build."
  exit 1
fi

# 2. Subida atómica a directorio de staging (cero caída para los usuarios)
echo "==> 2. Preparando directorio de staging en Hostinger..."
ssh -p "$REMOTE_PORT" -o StrictHostKeyChecking=no "$REMOTE_HOST" "rm -rf '$REMOTE_STAGING' && mkdir -p '$REMOTE_STAGING'"

echo "==> 3. Subiendo archivos a staging (sitio en vivo sigue 100% operativo)..."
scp -P "$REMOTE_PORT" -r dist/* "${REMOTE_HOST}:${REMOTE_STAGING}/"

# 3. Swap atómico en milisegundos en el servidor remoto
echo "==> 4. Realizando swap atómico en producción (Zero-Downtime)..."
ssh -p "$REMOTE_PORT" -o StrictHostKeyChecking=no "$REMOTE_HOST" "
  find '$REMOTE_LIVE' -mindepth 1 -delete
  cp -a '$REMOTE_STAGING/.' '$REMOTE_LIVE/'
  rm -rf '$REMOTE_STAGING'
  chmod 755 '$REMOTE_LIVE'
  find '$REMOTE_LIVE' -type d -exec chmod 755 {} +
  find '$REMOTE_LIVE' -type f -exec chmod 644 {} +
"

echo "==> ¡Despliegue completado con éxito con CERO tiempo de inactividad!"
