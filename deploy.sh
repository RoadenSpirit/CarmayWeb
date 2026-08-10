# Script de Despliegue Automático para Hostinger (deploy.sh)
# Ejecuta este script cada vez que hagas cambios importantes en tu proyecto Astro local.

echo "==> 1. Compilando proyecto Astro en estático..."
npm run build

echo "==> 2. Conectando por SSH y subiendo archivos a Hostinger..."
scp -P 65002 -r dist/* u771273295@195.179.239.30:domains/aqua-raven-173850.hostingersite.com/public_html/

echo "==> ¡Despliegue completado con éxito!"
