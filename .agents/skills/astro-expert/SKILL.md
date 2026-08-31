---
name: astro-expert
description: Use when building, reviewing, or refactoring Astro sites in this repo (Astro 5, output: 'static'). Covers data fetching in frontmatter, content layer/loaders, getStaticPaths for dynamic routes, passing plain data to components, SSG vs hybrid rendering, env vars, build-time caching, and error handling. Also use when analyzing architecture decisions like whether to use classes vs plain mappers for data fetched from an external API (WooCommerce).
---

# Astro Expert (Astro 5, SSG)

Referencia de mejores prácticas para este proyecto (Astro ^5.1, `output: 'static'`, Tailwind).

## Reglas de oro

1. **Fetch en el frontmatter, render en el template.** Todo fetch/build-time vive en el frontmatter (`---`). El template HTML solo recibe datos ya resueltos. No hay JS de cliente salvo `islands` explícitas.
2. **Datos planos cruzando el borde de componente.** Pasar clases o instancias complejas como `props` es permitido en SSG (se renderizan en servidor) pero NO es idiomático. Preferir objetos planos tipados (`ProductCardData`) o funciones mapeadoras puras. Mantener la lógica de negocio (cálculos, formateo) en una capa de datos y las props lo más planas posible.
3. **Tipos explícitos.** Todo prop de componente con `interface Props`. Tipar las respuestas de APIs externas.
4. **SSG = datos congelados en build.** La página se genera una vez; la frescura depende de reconstruir. Si se necesita frescura por ruta, marcar `prerender = false` en esa ruta (hybrid) o reconstruir por cron.
5. **Errores que no rompan el build.** Un corte de la API no debe tumbar `astro build`. Envolver los fetch en try/catch con fallbacks (estado vacío o datos por defecto) o usar loaders con error-handling.

## Data fetching

- Patrón correcto en SSG:
  ```astro
  ---
  import { woo } from '../api';
  const best = await woo.products.getBestSellers(8);
  ---
  <ProductShowcase products={best.map(p => p.toCard())} />
  ```
- Para rutas dinámicas (`/producto/[slug].astro`) usar `getStaticPaths()` y `generateStaticParams`/`params`, con cache de build.
- Alternativa oficial a partir de Astro 5: **content layer con loaders** (`src/content.config.ts` + `defineCollection`/`loader`) para catálogos externos. Da caché por build, tipos, y consultas. Considerarla si el catálogo crece o se quiere invalidación incremental.

## Precio de usar clases para el modelo de datos

El modelo `Product` (src/api/models/Product.ts) con getters computados (`isOnSale`, `discountPercent`, `isLowStock`, `toCard()`) es aceptable y aporta una única fuente de verdad para el formateo. Consideraciones:

- **Pro**: encapsula formateo/predicados que se repiten en cada sección de la web.
- **Contra**: para un DTO de solo lectura, un mapper puro (`toCard(raw): ProductCardData`) es más simple, serializable, y no arrastra estado. Las clases solo se justifican si hay invariantes/validación que proteger.
- **Regla**: si se conserva la clase, mantenerla inmutable y sin efectos; exponer siempre un DTO plano (`toCard`/`toJSON`) para cruzar a componentes. No pasar la instancia a los `.astro`.
- `isTrending` no debe basarse solo en `totalSales > 0`; definir criterio explícito (tag Tendencias, umbral de ventas, o bandera del negocio).

## Env y secretos

- `import.meta.env.*` funciona en Astro para variables públicas. NO exponer `consumerSecret` a cliente (en SSG no sale del build, pero nunca referenciarlo en un `<script>` o island).
- Usar `.env` para el build y `.env.example` documentado.

## Caché

- Caché en disco (`.wc-cache/`) para SSG evita golpear la API en cada build y en `astro dev`. Limpiarla cuando se quiera datos frescos o ante cambios de credenciales/urls.
- La caché del cliente (disco) es independiente de la caché del servidor (LiteSpeed/Redis) — ver skill/memoria sobre purgar ambas.

## Deploy

- `output: 'static'` → build genera `dist/` y el deploy copia los estáticos. No requiere Node en runtime.
- Si la web pasa a necesitar datos frescos por visita, evaluar `output: 'hybrid'` + prerender por ruta, o pasarela SSR con adapter Node, y en ese caso revisar el rate limit y la caché del cliente.