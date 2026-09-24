# Plan Maestro de Pruebas End-to-End y Evaluación QA (Playwright + Impeccable)

Este documento establece la metodología, criterios técnicos, perfiles de usuario y el protocolo de ejecución para la auditoría E2E sistemática de **CarmayWeb**, utilizando **Playwright** alojado en la VPS e integrando el marco de calidad del skill **Impeccable** (`craft-floor.md`, `audit.md`, `critique.md`).

---

## 1. Entorno de Ejecución y Herramientas

- **Motor de Navegación E2E:** Chromium headless ejecutado mediante Playwright a través del contenedor `n8n-app` de la VPS.
- **Entorno Evaluado:** Producción en vivo (`https://aqua-raven-173850.hostingersite.com/`).
- **Dispositivos y Viewports Auditados:**
  - **Móvil (Compacto):** `375px × 812px` (iPhone SE / Android).
  - **Tablet:** `768px × 1024px` (iPad).
  - **Desktop:** `1440px × 900px` (Laptop / Monitor Estándar).
- **Herramientas de Diagnóstico Integradas:**
  - Inspección DOM y métricas de desbordamiento horizontal (`scrollWidth > innerWidth`).
  - Detección de errores y advertencias en consola JavaScript del navegador (`page.on('console')`, `page.on('pageerror')`).
  - Medición de áreas táctiles en móvil ($\ge 44\text{px} \times 44\text{px}$).
  - Análisis de ratios de contraste WCAG AA ($\ge 4.5:1$ en texto normal, $\ge 3:1$ en texto grande).
  - Inspector estático Impeccable: `node .agents/skills/impeccable/scripts/detect.mjs`.

---

## 2. Matriz de Criterios Impeccable (6 Dimensiones)

1. **Accesibilidad (A11y):**
   - Contraste de texto y elementos interactivos sobre fondos oscuros (`#090b11`, `#0c0e17`, `#0f1120`).
   - Semántica HTML (`h1-h6`, `button` interactivos, `label` en inputs, `alt` descriptivo en imágenes).
   - Indicadores de foco visibles para navegación por teclado.
2. **Rendimiento:**
   - Cero *layout thrashing* o bucles de redibujado en scroll.
   - Animaciones fluidas a 60 FPS aceleradas por GPU (`transform`, `opacity`).
   - Carga lazy de imágenes (`loading="lazy"`).
3. **Responsive y Ergonomía Táctil:**
   - Cero scrollbar horizontal parásito (`scrollX === 0` en todos los anchos).
   - Objetivos táctiles mínimos de $44\text{px} \times 44\text{px}$ en botones y enlaces móviles.
   - Textos legibles en móvil (ningún texto funcional menor a $11\text{px}$).
4. **Tipografía y Paleta (Craft Floor):**
   - Coherencia de fuentes (`Outfit`, `Plus Jakarta Sans`, `Playfair Display`).
   - Sin fuentes genéricas del sistema en textos de marca.
   - Medida de cuerpo entre 65–75 caracteres por línea.
   - Paleta sobria y contrastante: dorado (`#D4AF37`, `amber-400`), morado brand (`#6d1e68`), naranja de precio/oferta (`#f97316`).
5. **Lógica de Visibilidad y Coherencia de Contenidos:**
   - Orden natural de lectura y composición (imágenes vs. textos explicativos).
   - Verificación estricta de datos comerciales:
     - Dirección física: *Avellaneda No. 260, Camagüey*.
     - WhatsApp oficial: *+REDACTED_PHONE_1*.
     - Teléfono de soporte: *+53 63791924*.
   - Sin claims vacíos, falsos ni información redundante.
6. **Funcionalidad e Integridad E2E:**
   - Despliegue del autocompletado en el buscador con mini-cards opacas en 2-3 columnas.
   - Sincronización de URL (`/tienda/?s=...`).
   - Sliders de presupuesto CUP e inputs numéricos libres.
   - Carrito de compras reactivo y formulario de checkout.

---

## 3. Arquetipos de Usuario Evaluados (Personas)

- **Casey (Usuario Móvil Distraído - 375px):** Evalúa la experiencia con una sola mano, alcance del pulgar, áreas táctiles de botones y fluidez en móvil.
- **Riley (Stress Tester):** Busca casos extremos: filtros sin resultados, búsquedas ortográficamente complejas, inputs inesperados en checkout y persistencia de estado.
- **Jordan (Primerizo Confundido):** Audita la claridad de textos, etiquetas explícitas sin tecnicismos y facilidad para navegar o encargar por WhatsApp.

---

## 4. Fases de Ejecución

| Etapa | Superficie | Archivo de Resultados | Alcance Principal |
|---|---|---|---|
| **Etapa 1** | `/` (Home) | `QA_STAGE_1_INDEX.md` | Header 3 pisos, Hero, ValueProps, Categorías, StoreBanner, Escaparate, Visión, FAQ, Testimonios, Footer. |
| **Etapa 2** | `/tienda/` y `/tienda/zapatos/` | `QA_STAGE_2_TIENDA.md` | Barra de categorías activas, CatalogFilterBar (tags, slider CUP, badge búsqueda), Rejilla Catálogo, Autocompletado, Empty State. |
| **Etapa 3** | `/contact` y `/finalizar-pedido/` | `QA_STAGE_3_CONTACT.md` | Hero de contacto, Canales directos, Banner de entrega, Formulario Checkout (datos, domicilio, pago CUP/USD, WhatsApp). |
