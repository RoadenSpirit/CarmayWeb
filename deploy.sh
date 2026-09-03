# Script de Despliegue Automático para Hostinger (deploy.sh)
# Ejecuta este script cada vez que hagas cambios importantes en tu proyecto Astro local.

echo "==> 1. Compilando proyecto Astro en estático..."
npm run build

echo "==> 2. Limpiando directorio remoto..."
ssh -p 65002 -o StrictHostKeyChecking=no u771273295@195.179.239.30 "rm -rf /home/u771273295/domains/aqua-raven-173850.hostingersite.com/public_html/*"

echo "==> 3. Conectando por SSH y subiendo archivos a Hostinger..."
scp -P 65002 -r dist/* u771273295@195.179.239.30:/home/u771273295/domains/aqua-raven-173850.hostingersite.com/public_html/

echo "==> ¡Despliegue completado con éxito!"
