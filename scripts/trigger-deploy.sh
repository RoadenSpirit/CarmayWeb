#!/usr/bin/env bash
set -e

# trigger-deploy.sh: Disparador seguro para n8n y automatizaciones
# Ubicación: CarmayWeb/scripts/trigger-deploy.sh
# Uso:
#   ./scripts/trigger-deploy.sh [TASA_CUP_OPCIONAL]
#   Ejemplo: ./scripts/trigger-deploy.sh 800

PROJECT_DIR="/home/carmay-dev/proyectos/CarmayWeb"
LOCK_FILE="/tmp/carmay-deploy.lock"
LOG_FILE="/tmp/carmay-deploy.log"

cd "$PROJECT_DIR"

echo "=== [$(date '+%Y-%m-%d %H:%M:%S')] Iniciando Trigger Autónomo CarmayWeb ===" >> "$LOG_FILE"

# Control de bloqueo: evitar múltiples builds concurrentes
exec 200>"$LOCK_FILE"
flock -n 200 || {
  echo "[-] Otro proceso de despliegue ya se encuentra en ejecución. Omitiendo concurrencia." | tee -a "$LOG_FILE"
  exit 0
}

# 1. Si se pasa una tasa CUP explícita como argumento
if [ -n "$1" ]; then
  export WC_CUP_EXCHANGE_RATE="$1"
  echo "[+] Tasa CUP fijada explícitamente desde argumento: $1" | tee -a "$LOG_FILE"
fi

# 2. Limpiar caché local de WooCommerce para forzar la lectura fresca de precios/stock actualizados
echo "[+] Limpiando caché local .wc-cache para forzar sincronización con WooCommerce..." | tee -a "$LOG_FILE"
rm -rf .wc-cache

# 3. Ejecutar el despliegue Zero-Downtime
echo "[+] Ejecutando deploy.sh (Zero-Downtime Staging)..." | tee -a "$LOG_FILE"
./deploy.sh >> "$LOG_FILE" 2>&1

EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo "[✓] Despliegue completado con éxito a las $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"
else
  echo "[✗] Error en el despliegue (Código de salida: $EXIT_CODE)" | tee -a "$LOG_FILE"
fi

exit $EXIT_CODE
