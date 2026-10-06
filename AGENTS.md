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
