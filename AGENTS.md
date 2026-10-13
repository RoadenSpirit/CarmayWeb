## 🌐 Contexto del VPS e Infraestructura Compartida
Este proyecto se ejecuta en el VPS (`carmay-dev`). La información de servicios, puertos y dependencias compartidas está unificada:

- **Skills globales del servidor:** Accedidos vía `.agents/skills` (apunta a `~/.config/opencode/skills/`). Utiliza la skill `vps-services-and-infrastructure` para consultar detalles de conectividad.
- **MCPs globales:** Centralizados exclusivamente en `~/.config/opencode/opencode.json`.
- **Servicios clave en localhost:**
  - **WhatsApp Baileys REST API:** `http://localhost:3000` (requiere header `x-api-key`). Usado por `whatsappAPI`, `ROBERTO` y flujos n8n.
  - **n8n Automation Engine:** `http://localhost:5678` (`https://carmayn8n.cloud`).
  - **AsereAI Core API (FastAPI + Playwright):** `http://localhost:8000` (`https://asere.carmayn8n.cloud`).
  - **OmniRoute Proxy LLM:** `http://localhost:20128` (`https://omni.carmayn8n.cloud`).
- **Guía completa de arquitectura y reglas:** Ver `/home/carmay-dev/proyectos/CONVENCIONES_VPS.md`.

# Guía Técnica para Agentes de IA (AGENTS.md)

Este documento registra decisiones críticas de arquitectura, problemas resueltos y utilidades internas disponibles para cualquier agente o desarrollador que trabaje en **CarmayWeb**.

---

## 1. Arquitectura del Header Sticky y Solución al Temblor (Scroll Jitter)

### Estructura de 3 Pisos en `src/components/Header.astro`
- **Piso 1 (`#header-main-nav`):** Logo, enlaces principales (`Inicio`, `Tienda`, `Contacto`) matemáticamente centrados mediante `absolute left-1/2 -translate-x-1/2`, y botones de acción (Carrito con contador reactivo, WhatsApp y menú móvil). **SIEMPRE FIJO (`top: 0`).**
- **Piso 2 (`#categorias-navbar`):** Accesos directos a categorías en `/tienda/` y catálogo (`Calzado`, `Ropa`, `Bolsos`, `Tecnología`, `Accesorios`). **SIEMPRE FIJO bajo el Piso 1.**
- **Piso 3 (`#subnav-collapsible`):** Buscador interactivo y carrusel de mensajes de valor (`SubNavbar.astro`). **ÚNICO PISO COLAPSABLE AL SCROLL.**

### El Problema Resuelto (Causa de la Vibración / Temblor)
1. **Doble aceleración compuesta:** Anteriormente, la clase `.is-collapsed` aplicaba simultáneamente `transform: translateY(-100%)` (GPU) y una reducción de altura `max-height: 0px` (CPU). Esto forzaba a los elementos hijos a desplazarse al doble de velocidad ($142\text{px}$ en $300\text{ms}$), colisionando con el borde superior del header y provocando un tirón visual brusco.
2. **Bucle de contradicciones en el listener de scroll:** Al reducir la altura del header sticky en $52\text{px}$, el documento se acortaba automáticamente, provocando que `window.scrollY` cayera en $-52\text{px}$. Un listener de scroll sin histeresis interpretaba ese salto como un movimiento hacia arriba del usuario, re-expandiendo el navbar inmediatamente en un bucle a 60 FPS.

### La Solución Implementada
- **Plegado Puro por CSS Grid:**
  ```css
  .subnav-grid {
    display: grid;
    grid-template-rows: 1fr;
    opacity: 1;
    transition: grid-template-rows 0.34s cubic-bezier(0.22, 1, 0.36, 1),
                opacity 0.24s ease-out;
    will-change: grid-template-rows, opacity;
  }
  .subnav-grid.is-collapsed {
    grid-template-rows: 0fr;
    opacity: 0;
    pointer-events: none;
  }
  .subnav-grid-inner {
    min-height: 0;
    overflow: hidden;
  }
  ```
  - Se eliminó completamente `transform: translateY(-100%)` para evitar velocidades compuestas.
  - La opacidad baja a 0 en $240\text{ms}$, disolviendo el buscador antes de que la caja termine de plegarse a los $340\text{ms}$.
- **Controlador Anti-Bucle con Histeresis de 70px:**
  - `COLLAPSE_THRESHOLD = 70` (requiere $70\text{px}$ continuos hacia abajo).
  - `EXPAND_THRESHOLD = 70` (requiere $70\text{px}$ continuos hacia arriba).
  - Dado que $70\text{px} > 52\text{px}$, el salto artificial del header nunca cruza el umbral.
  - `lockTransition` atómico de $360\text{ms}$ que silencia cualquier evento de scroll mientras corre la animación CSS.

---

## 2. Herramienta de Diagnóstico y Telemetría en Reserva: `debugWatcher.ts`

Ubicación: `src/utils/debugWatcher.ts`

### Propósito
Permite auditar el comportamiento visual y mecánico de cualquier elemento del DOM por su `ID` durante un periodo de tiempo determinado (por defecto 30 segundos), detectando:
- Mutaciones de atributos (`class` y `style`) vía `MutationObserver`.
- Contradicciones y cambios rápidos de estado ($< 400\text{ms}$) para detectar bucles de toggle.
- Inicio y finalización de transiciones CSS (`transitionstart`, `transitionend`).
- Muestreo de `scrollY`, deltas y altura del elemento (`offsetHeight`).
- Despliegue de un HUD visual flotante en pantalla con estadísticas en vivo.
- Generación de informe en consola con `console.table(logs)` y almacenamiento en `window.__debugWatcherLogs`.
- Transmisión remota de telemetría por HTTP POST al webhook de n8n (`https://carmayn8n.cloud/webhook/carmay-telemetry`).

### Cómo Usarlo en Futuras Tareas de Depuración
Para activar la herramienta sobre cualquier componente problemático:
1. Importar e invocar en el layout o página deseada:
   ```astro
   <script>
     import { startElementWatcher } from '../utils/debugWatcher';
     document.addEventListener('DOMContentLoaded', () => {
       startElementWatcher('id-del-elemento', 30); // monitorea por 30 segundos
     });
   </script>
   ```
2. Si se requiere recibir los logs de forma remota, reactivar en n8n el flujo `Carmay Telemetry Collector` (ID: `VKKoV2FewcG8BKba`).
3. Al terminar la sesión de depuración, retirar la llamada del archivo Astro. El módulo en `src/utils/debugWatcher.ts` debe permanecer preservado en el repositorio como herramienta de diagnóstico estándar.

---

## 3. Regla Estricta e Inmutable: Preservación de UI/UX y Componentes Aprobados

### Principio de Cambios Estrictamente Aditivos
**BAJO NINGÚN CONCEPTO se deben alterar, simplificar, recortar ni eliminar estilos, mini-cards, estados visuales, layouts o lógica de interacción que hayan sido previamente diseñados, implementados y aprobados por el usuario.**

1. **Mejoras sin destrucción:** Si el usuario solicita mejorar, sincronizar o ampliar una funcionalidad (por ejemplo, conectar el buscador a la URL o al catálogo):
   - La nueva funcionalidad debe **sumarse** a la existente.
   - **NUNCA** se debe sustituir o borrar el renderizado rico preexistente (ej. autocompletado en rejilla, mini cards con imágenes y precios duales, vistas sin resultados con botón dinámico a WhatsApp y productos recomendados).
2. **Prohibición de simplificaciones unilaterales:** Un agente no puede decidir de forma autónoma reducir el diseño de un componente a una versión minimalista o más básica.
3. **Consulta previa obligatoria:** Si una refactorización requiere modificar la estructura visual o retirar algún elemento ya existente, se debe consultar y obtener aprobación expresa del usuario antes de tocar el código.

---

## 4. Despliegue Autónomo Zero-Downtime y Tasa CUP Dinámica

### Arquitectura de Despliegue de Impacto Cero (`deploy.sh`)
- **Problema resuelto:** Anteriormente `deploy.sh` ejecutaba `find ... -delete` antes de `scp`, provocando una ventana de 15 a 20 segundos donde los usuarios veían errores 404 durante la subida de archivos a Hostinger.
- **Solución implementada:** Directorio de Staging Remoto con Swap Atómico:
  1. `npm run build` compila la web estática en local (`dist/`).
  2. `scp` transfiere los archivos a `public_html_staging/` en el servidor de Hostinger. Durante todo el tiempo de transferencia por internet, la web en vivo en `public_html/` continúa **100% activa**.
  3. Al completarse la subida al 100%, un script por SSH ejecuta el swap en disco local de Hostinger (`find public_html -mindepth 1 -delete && cp -a public_html_staging/. public_html/ && rm -rf public_html_staging`).
  4. La sustitución ocurre en menos de 100ms. Verificado empíricamente con 145 peticiones continuas a 250ms de intervalo sin un solo error (0ms de inactividad).

### Deducción Autónoma de Tasa de Cambio CUP (`src/api/resources/Currency.ts`)
- **Jerarquía de Cálculo:**
  1. **Tasa Explícita por Entorno:** Si `WC_CUP_EXCHANGE_RATE` es provista en el build (ej. desde n8n), tiene máxima prioridad.
  2. **API de WOOCS:** Intenta consultar el endpoint de WordPress `../woocs/v3/currency`.
  3. **Auto-Deducción desde Productos:** Si las anteriores no aplican, inspecciona los primeros productos publicados de WooCommerce, extrayendo `_precio_cup` (en `meta_data` o descripción) y dividiéndolo por el precio en USD (`price`). Deduce la tasa real en tiempo real de forma matemática y autónoma.
  4. **Fallback:** `wooConfig.cupExchangeRate` (700).

### Script Seguro para n8n y Automatizaciones (`scripts/trigger-deploy.sh`)
- Ubicación: `scripts/trigger-deploy.sh`
- Ejecutable desde nodos Execute Command de n8n:
  `/home/carmay-dev/proyectos/CarmayWeb/scripts/trigger-deploy.sh [TASA_CUP_OPCIONAL]`
- Incluye:
  - Control de concurrencia con candado `flock` sobre `/tmp/carmay-deploy.lock` para descartar ejecuciones simultáneas redundantes.
  - Limpieza automática de la caché `.wc-cache` para forzar la lectura de precios y stock actualizados en WooCommerce.
  - Registro de auditoría y timestamps en `/tmp/carmay-deploy.log`.

---

## 5. Activos Pendientes de Fotografía Oficial (Backlog Estratégico)
- **Fotografía Oficial de la Tienda Física:** Pendiente sustituir o complementar los recursos actuales (`tienda-fisica.png`, `envio-garantizado.jpg`) cuando el cliente suministre las imágenes reales en alta resolución de la fachada e interior en Avellaneda 260.
- **Fotografía Real de Categorías:** Pendiente reemplazar los enlaces remotos temporales de Unsplash en `Categories.astro` y `tienda.astro` por las fotos oficiales de stock de Carmay Outfit (`/categorias/calzado.jpg`, `/categorias/ropa.jpg`, `/categorias/bolsos.jpg`, `/categorias/tecnologia.jpg`, `/categorias/accesorios.jpg`).

---

## 6. Regla Inmutable de Exclusión de Productos Huérfanos y Alerta en n8n

### Principio de Cero Productos Sin Categoría en la Web
**BAJO NINGÚN CONCEPTO un producto sin categoría oficial válida puede llegar al catálogo, buscador, fichas de producto ni a la compilación estática.**

1. **Categorías Oficiales Válidas Exclusivas:**
   - `zapatos` (Calzado)
   - `ropa` (Ropa)
   - `jackets` (Bolsos y Mochilas)
   - `tecnologia` (Tecnología)
   - `accesorios` (Accesorios)
2. **Filtrado en Build (CarmayWeb SSG):**
   - Propiedad `Product.hasValidCategory` en `src/api/models/Product.ts`.
   - Se aplica en `[slug].astro` (`getStaticPaths`), `tienda.astro` (catálogo), `Layout.astro` (buscador) e `index.astro` (showcases).
   - Cualquier producto huérfano es automáticamente excluido del build.
3. **Flujo de Ingesta en n8n (`bWC0jPNJYQ7d0D7H`):**
   - El nodo `Normalizar Datos` descarta cualquier producto del Sheet cuya columna `CATEGORÍA` esté vacía o no coincida con las 5 categorías oficiales.
   - El nodo `Detectar Huérfanos` escanea el Sheet y, si detecta ítems huérfanos, activa automáticamente el nodo `Enviar Alerta WhatsApp Admin` (HTTP Request a `http://baileys-sales-api:3000/send`) notificando la lista al Administrador (`+REDACTED_PHONE_1`).

---

## 7. Motor de Recomendaciones Semántico Multicriterio (`src/utils/productRecommender.ts`)

### Propósito y Rendimiento
Sustituye la antigua consulta aleatoria de WooCommerce por un algoritmo determinista precalculado en memoria durante el build ($1.1\text{ ms}$ por producto, 0 llamadas HTTP redundantes a la base de datos).

### Reglas de Afinidad y Scoring Matemático
$$\text{Score} = S_{\text{semántica}} + S_{\text{precio}} + S_{\text{comercial}} + S_{\text{desempate}}$$

1. **Aislamiento Estricto por Categoría (Filtro Obligatorio):**
   - El producto recomendado debe compartir **exactamente la misma categoría canónica** (`candidato.categorySlug === target.categorySlug`). Un calzado solo recomienda calzado; un inversor solo tecnología.
   - Exclusión de productos propios (`slug !== target.slug`), agotados (`isInStock === true`) o sin imagen real.
2. **Afinidad Léxica y Semántica ($+40\text{ a }+90\text{ pts}$):**
   - Tokenización y lematización morfológica en español sin diacríticos ni stopwords (`sandalias` $\rightarrow$ `sandalia`, `inversores` $\rightarrow$ `inversor`).
   - Coincidencia exacta de raíz: $+40\text{ pts}$ base $+ 25\text{ pts}$ por token adicional.
   - Diccionario de familias complementarias (`CATEGORY_AFFINITY_MAP`): vincula familias afines como `inversor` $\leftrightarrow$ `panel`/`solar`/`bateria`, `timbre` $\leftrightarrow$ `camara`, `sandalia` $\leftrightarrow$ `chancleta` ($+25\text{ pts}$ base $+ 15\text{ pts}$ adicional).
3. **Coherencia de Rango de Precio ($0\text{ a }20\text{ pts}$):**
   - Ratio: $\frac{\min(P_A, P_B)}{\max(P_A, P_B)} \times 20$. Favorece productos en la misma franja económica y castiga desproporciones absurdas (ej. cables vs inversores).
4. **Demanda Comercial y Popularidad ($0\text{ a }18\text{ pts}$):**
   - Bonificación por volumen de ventas real (`totalSales` $\times 2.5$, máx 10).
   - Bonificación por rebaja activa (`isOnSale` $+5\text{ pts}$) y tendencia (`isTrending` $+3\text{ pts}$).
5. **Diversidad y Desempate Determinista ($0\text{ a }3\text{ pts}$):**
   - Desempate por hash combinado de slugs $\text{hash}(S_A + S_B)$. Asegura que cada producto tenga un grupo de 4 recomendados único y diverso, evitando la repetición monótona en el catálogo.
