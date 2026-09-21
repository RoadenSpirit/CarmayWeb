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
