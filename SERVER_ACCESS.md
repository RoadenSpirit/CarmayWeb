# Acceso al Servidor WordPress (Carmay Outfit)

## Datos de Conexión SSH

* **Host:** `195.179.239.30`
* **Puerto:** `65002`
* **Usuario:** `u771273295`
* **Proveedor:** Hostinger Cloud / Shared Hosting (`us-imm-web1064.main-hosting.eu`)
* **Ruta raíz de WordPress:** `domains/carmayoutfit.com/public_html`
* **Alias SSH configurado:** `carmay-wp`

---

## Uso de Comandos desde la Terminal Local

### Conexión Directa SSH
```bash
ssh carmay-wp
```
o
```bash
ssh -p 65002 u771273295@195.179.239.30
```

### Ejecutar WP-CLI en Remoto
```bash
ssh carmay-wp "wp --path=domains/carmayoutfit.com/public_html <comando>"
```

Ejemplos útiles:
```bash
# Ver versión de WordPress
ssh carmay-wp "wp --path=domains/carmayoutfit.com/public_html core version"

# Listar plugins activos
ssh carmay-wp "wp --path=domains/carmayoutfit.com/public_html plugin list --status=active"

# Limpiar caché de Litespeed
ssh carmay-wp "wp --path=domains/carmayoutfit.com/public_html litespeed-purge all"
```
