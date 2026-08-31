# WooCommerce API — Cliente Headless para CarmayWeb

Sistema de peticiones a la API REST de WooCommerce con separación de
responsabilidades por capas. Diseñado para respetar los límites de Hostinger
(rate limit + caché en disco) y para consumirse en el build estático de Astro.

## Estructura

```
src/api/
├── config.ts                    # Configuración desde variables de entorno
├── client/
│   ├── RateLimiter.ts           # Throttling (máx. peticiones/segundo)
│   └── WooCommerceClient.ts     # HTTP: auth, retry, timeout, paginación, caché
├── types/
│   └── woocommerce.ts           # Tipos de la API REST de WooCommerce
├── models/
│   └── Product.ts               # Modelo de dominio (datos normalizados para la web)
├── resources/
│   ├── Products.ts              # Consultas de productos (más vendidos, ofertas, bajo stock…)
│   ├── Categories.ts            # Categorías
│   └── Tags.ts                  # Etiquetas
└── index.ts                     # Fachada pública (`createWooCommerce`, singleton `woo`)
```

## Configuración

Copia `.env.example` a `.env` y completa las credenciales:

- Crear las claves en WordPress → WooCommerce → Ajustes → Avanzado → API REST.
- Permisos recomendados: **Solo lectura**.
- ⚠️ **Hostinger no expone el header `Authorization` a PHP**: el cliente
  autentica por query-string (`consumer_key` / `consumer_secret`).

## Uso

```ts
import { woo } from '../api';

// En el frontmatter de una página Astro (build time):
const bestSellers = await woo.products.getBestSellers(8);
const ofertas     = await woo.products.getOnSale(8);
const bajoStock   = await woo.products.getLowStock(6);
const porCategoria = await woo.products.getByCategory(37);
const resultado   = await woo.products.search('vestido');

// Cada producto es una instancia de la clase Product:
bestSellers.forEach((p) => {
  p.name;                 // "VESTIDO NEGRO USA"
  p.priceFormatted;       // "$9.25 USD"
  p.isOnSale;             // true/false
  p.discountPercent;      // 20
  p.stockQuantity;        // 4
  p.isLowStock;           // true si stock <= 5
  p.toCard();             // objeto listo para <ProductCard />
});
```

También puedes crear una instancia con configuración propia:

```ts
import { createWooCommerce } from '../api';
const woo = createWooCommerce({ maxRequestsPerSecond: 2, cacheTtlMs: 600_000 });
```

## Protección ante los límites de Hostinger

- **Caché en disco** (`.wc-cache/`): el resultado de cada endpoint se guarda
  durante `WC_CACHE_TTL_MS` (10 min por defecto). Los rebuilds seguidos no
  vuelven a golpear la API.
- **Rate limit**: `WC_MAX_REQUESTS_PER_SECOND` (4 por defecto).
- **Reintentos** con backoff ante `429` y errores `5xx`.
- **Timeout** configurable por petición.
- **SSG**: el fetch ocurre en build; la web servida es estática y no hace
  llamadas en runtime.

## Prueba

```bash
npx tsx scripts/test-api.ts
```

## Endpoints utilizados

| Recurso      | Endpoint REST de WooCommerce |
|--------------|------------------------------|
| Productos    | `/wc/v3/products`            |
| Categorías   | `/wc/v3/products/categories` |
| Etiquetas    | `/wc/v3/products/tags`       |