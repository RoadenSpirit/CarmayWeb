# Informe de Auditoría E2E y Evaluación QA — Etapa 2: Tienda y Filtros

**Superficies Evaluadas:** `/tienda/` (Catálogo Completo) y `/tienda/zapatos/` (Sub-ruta de Categoría)  
**URL Evaluada:** `https://aqua-raven-173850.hostingersite.com/tienda/`  
**Motor E2E:** Chromium Headless (Playwright VPS)  
**Marco de Calidad:** Impeccable Design Quality & Web Interface Guidelines  
**Fecha de Evaluación:** 24 de Septiembre, 2026  

---

## 1. Provenance y Resumen de Ejecución

- **Método:** Playwright Headless Automation (Node.js en VPS) + Impeccable Static Detector (`detect.mjs`).
- **Dispositivos y Viewports Auditados:**
  - **Móvil:** `375px × 812px` (iPhone SE).
  - **Tablet:** `768px × 1024px` (iPad).
  - **Desktop:** `1440px × 900px` (Laptop / Monitor Estándar).
- **Volumen de Catálogo Auditado:** **263 productos válidos** en tiempo real.
- **Sub-ruta de Categoría (`/tienda/zapatos/`):** **45 productos** filtrados en tiempo de compilación.
- **Consola del Navegador:** 0 errores de JavaScript, 0 excepciones no controladas.
- **Rendimiento de Red:** Catálogo cargado con HTTP 200; imágenes con `loading="lazy"` para evitar consumo de datos innecesario.

---

## 2. Design Health Score (Heurísticas de Nielsen en Catálogo)

Evaluación ponderada sobre 10 heurísticas fundamentales (Escala 0–4 por dimensión):

| # | Heurística | Puntuación | Hallazgo Clave |
|---|---|:---:|---|
| 1 | **Visibilidad del Estado del Sistema** | **4/4** | Contador de resultados ultra-preciso (`263 productos` $\rightarrow$ `20 en rebaja` $\rightarrow$ `17 en sandalias`). La barra de acento del header y el slider dual reflejan el rango CUP en tiempo real. |
| 2 | **Relación entre Sistema y Mundo Real** | **4/4** | Precios duales jerárquicos (CUP prominentemente en naranja + USD en gris/blanco). Botón de WhatsApp integrado en tarjetas. |
| 3 | **Control y Libertad del Usuario** | **4/4** | Botón dinámico "✕ Limpiar filtros", chip `Búsqueda: "sandalias" ✕` descartable con un solo toque y botón de rescate en el estado vacío. |
| 4 | **Consistencia y Estándares** | **4/4** | Tarjetas de producto (`ProductCard.astro`) con proporciones idénticas en rejilla, slots de título protegidos y botones de acción unificados. |
| 5 | **Prevención de Errores** | **4/4** | Sliders duales de presupuesto con topes cruzados (el mínimo nunca supera el máximo); inputs numéricos con debounce que no traban la escritura. |
| 6 | **Reconocimiento antes que Recuerdo** | **4/4** | Píldora de búsqueda activa visible en la barra de filtros; el usuario siempre sabe qué filtros tiene aplicados. |
| 7 | **Flexibilidad y Eficiencia de Uso** | **4/4** | Sincronización instantánea de la URL (`/tienda/?s=...&rebaja=true`) permitiendo compartir búsquedas filtradas directamente por link. |
| 8 | **Diseño Estético y Minimalista** | **3.5/4** | Paleta neo-dark sobria y elegante. Empty State limpio y ordenado sin ruido visual. Micro-detalle en la altura de las píldoras de tag en móvil (38px). |
| 9 | **Reconocimiento y Recuperación de Errores** | **4/4** | Si los filtros no arrojan resultados, el `#filter-empty-state` explica el motivo con claridad y ofrece el botón "Ver todos los productos" que restaura el catálogo con un clic. |
| 10 | **Ayuda y Documentación** | **3.5/4** | Soporte de compra por WhatsApp disponible en la cabecera fija y banner de entrega garantizada. |
| **Total** | | **39 / 40** | **Excelente (Minor Polish)** |

---

## 3. Veredicto de Especificidad de Diseño (Impeccable Verdict)

### ¿El catálogo se siente exclusivo para CarmayWeb o genérico?
**Veredicto: Excepcionalmente Específico y Adaptado al Mercado Local (Pass).**
- **Sincronización Bidireccional:** El flujo entre el buscador de la cabecera y la barra de filtros del catálogo funciona como una sola entidad reactiva. Escribir *"sandalias"* actualiza tanto el autocompletado flotante como la cuadrícula del catálogo a 17 productos, sincronizando la URL (`?s=sandalias`).
- **Navegación de Categorías:** El segundo piso de la cabecera fija (`#categorias-navbar`) resalta dinámicamente la categoría activa (`Calzado` con halo amarillo en `/tienda/zapatos/`), manteniendo al usuario orientado en todo momento.
- **Stock y Precios Reales:** Las tarjetas de producto muestran el indicador de stock real y el precio convertido a CUP según la tasa comercial de la tienda.

---

## 4. Pruebas Funcionales e Interactivas Ejecutadas

### 4.1. Filtro por Píldoras de Tags
- **"En Rebaja":** Filtró instantáneamente de **263 a 20 productos** con ofertas activas.
- **"Tendencias":** Filtró a **29 productos** con alta demanda.
- **Botón "✕ Limpiar filtros":** Aparece automáticamente cuando hay filtros activos y los desactiva todos al hacer clic, restaurando el contador a 263.

### 4.2. Sincronización de Búsqueda por URL (`/tienda/?s=sandalias`)
- **Autollenado:** El input `#subnav-search-input` leyó el parámetro `s` y se autocompletó con `"sandalias"`.
- **Badge de Filtro:** Apareció el chip `Búsqueda: "sandalias" ✕` en la barra de filtros.
- **Concordancia Difusa:** Mostró exactamente los **17 productos** relacionados con sandalias.
- **Limpieza:** Al hacer clic en la `✕` del badge, la búsqueda se canceló, limpió el input del header y restauró los 263 productos.

### 4.3. Prueba de Estado Vacío (Empty State)
- **Activación:** Se forzó un rango de precio imposible (349.999 a 350.000 CUP).
- **Respuesta:** El grid ocultó las tarjetas y mostró el contenedor `#filter-empty-state` con el mensaje: *"No encontramos productos en este rango"*.
- **Recuperación:** Al pulsar el botón `"Ver todos los productos"`, se restablecieron los sliders y reaparecieron los 263 productos.

---

## 5. Hallazgos Técnicos y de Ergonomía por Severidad

### [P2] Altura Táctil de las Píldoras de Tag en Móvil (38px)
- **Ubicación:** `src/components/CatalogFilterBar.astro` (botones `#filter-tag-sale` y `#filter-tag-trending`).
- **Detalle:** Su altura calculada en móvil es de `38px` (`py-2.5`).
- **Impacto (Persona Casey):** El estándar de accesibilidad y ergonomía móvil para pulgares recomienda un mínimo de $44\text{px} \times 44\text{px}$.
- **Solución Recomendada:** Incrementar el padding vertical a `py-3` (alcanzando `42px-44px`) en viewports móviles.
- **Comando Impeccable:** `$impeccable adapt`

### [P3] Peticiones de Imagen Abortadas por Lazy Loading en Test Headless
- **Ubicación:** 6 imágenes de productos remotos en `carmayoutfit.com/wp-content/...`.
- **Detalle:** En el test automatizado, el navegador abortó la descarga de 6 imágenes (`net::ERR_ABORTED`) al navegar antes de hacer scroll hasta el final del catálogo de 263 artículos.
- **Impacto:** Ninguno para usuarios reales; es el comportamiento nativo esperado de `loading="lazy"` cuando el usuario no se desplaza hasta el final de una lista larga.

---

## 6. Evaluación de Arquetipos de Usuario (Personas)

### Casey (Usuario Móvil - 375px)
- **Prueba en iPhone SE:**
  - `document.scrollWidth = 375px`, `window.innerWidth = 375px` (**PASS absoluto**, 0 desbordamiento horizontal).
  - La cuadrícula de productos pasa fluidamente de 4 columnas en desktop a 2 columnas limpias en móvil, con títulos truncados a 2 líneas sin desajustes.

### Riley (Stress Tester)
- **Pruebas de Límites:**
  - Movimiento rápido de sliders: el slider dual responde sin parpadeos ni bloqueos de redibujado.
  - Búsqueda combinada: buscar *"sandalias"* y activar a la vez *"En Rebaja"* filtra la intersección matemática con precisión.

### Jordan (Primerizo Confundido)
- **Pruebas de Comprensión:**
  - El usuario siempre ve el total de resultados en el contador superior.
  - Los botones de "Ver Detalles" y "Agregar al Carrito" son explícitos y contrastantes.

---

## 7. Veredicto Final de la Etapa 2
- **Calificación Global:** **97.5 / 100 (Sobresaliente)**.
- **Estado:** **Aprobado para Producción.**
- **Acción Menor Sugerida para la ronda final:** Ajuste preventivo del padding vertical en las 2 píldoras de filtro en móvil (`py-3` para garantizar $\ge 42\text{px}$).
