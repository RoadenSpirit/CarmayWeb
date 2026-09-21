/**
 * Script de Diagnóstico Forense y Telemetría para Elementos DOM
 * Monitorea durante 30 segundos todas las mutaciones de clases, transiciones CSS,
 * eventos de scroll y re-cálculos de layout en un elemento por ID.
 */

export function startElementWatcher(targetId: string, durationSeconds: number = 30) {
  if (typeof window === 'undefined') return;

  const target = document.getElementById(targetId);
  if (!target) {
    console.warn(`[DebugWatcher] Elemento con id "${targetId}" no encontrado.`);
    return;
  }

  console.log(`%c[DebugWatcher] INICIANDO MONITOREO DE #${targetId} POR ${durationSeconds}s...`, 'background: #1e1b4b; color: #fbbf24; font-weight: bold; padding: 4px 8px; border-radius: 4px;');

  // Panel visual HUD flotante en pantalla para observar el comportamiento en tiempo real
  const hud = document.createElement('div');
  hud.id = 'debug-watcher-hud';
  hud.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 99999;
    background: rgba(10, 12, 20, 0.95);
    border: 1px solid #f59e0b;
    border-radius: 12px;
    padding: 12px 16px;
    color: #fff;
    font-family: monospace;
    font-size: 11px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.8);
    pointer-events: none;
    max-width: 380px;
    line-height: 1.4;
  `;
  hud.innerHTML = `
    <div style="font-weight:bold; color:#f59e0b; margin-bottom:4px; display:flex; justify-content:space-between;">
      <span>🔍 WATCHER: #${targetId}</span>
      <span id="hud-timer">${durationSeconds}s</span>
    </div>
    <div id="hud-classes" style="color:#38bdf8; word-break:break-all;">Clases: ${target.className}</div>
    <div id="hud-stats" style="margin-top:4px; color:#a3e635;">Mutaciones: 0 | Toggles ráppidos: 0</div>
    <div id="hud-scroll" style="color:#cbd5e1;">ScrollY: ${Math.round(window.scrollY)}px</div>
    <div id="hud-last-event" style="color:#f43f5e; margin-top:4px;">Estado: Calmo</div>
  `;
  document.body.appendChild(hud);

  const logs: Array<{
    timestamp: number;
    timeOffsetMs: number;
    eventType: string;
    classes: string;
    height: number;
    scrollY: number;
    note: string;
  }> = [];

  const startTime = performance.now();
  let mutationCount = 0;
  let rapidToggleCount = 0;
  let lastToggleTime = 0;
  let lastClassState = target.classList.contains('is-collapsed');

  function updateHUD(note: string, isAlert = false) {
    const timerEl = document.getElementById('hud-timer');
    const classesEl = document.getElementById('hud-classes');
    const statsEl = document.getElementById('hud-stats');
    const scrollEl = document.getElementById('hud-scroll');
    const lastEventEl = document.getElementById('hud-last-event');

    const remaining = Math.max(0, Math.ceil(durationSeconds - (performance.now() - startTime) / 1000));
    if (timerEl) timerEl.textContent = `${remaining}s`;
    if (classesEl) classesEl.textContent = `Clases: ${target.className}`;
    if (statsEl) statsEl.textContent = `Mutaciones: ${mutationCount} | Toggles rápidos: ${rapidToggleCount}`;
    if (scrollEl) scrollEl.textContent = `ScrollY: ${Math.round(window.scrollY)}px | Altura: ${target.offsetHeight}px`;
    if (lastEventEl) {
      lastEventEl.textContent = note;
      lastEventEl.style.color = isAlert ? '#ef4444' : '#38bdf8';
    }
  }

  // 1. Observer de Mutaciones de Atributos y Clases
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'attributes' && m.attributeName === 'class') {
        mutationCount++;
        const now = performance.now();
        const currentCollapsed = target.classList.contains('is-collapsed');
        let isRapidToggle = false;
        let note = `Clase cambiada a: ${target.className}`;

        // Detección de Temblor: si el estado cambió en menos de 350ms respecto al anterior
        if (currentCollapsed !== lastClassState) {
          const timeSinceLastToggle = now - lastToggleTime;
          if (timeSinceLastToggle < 350 && lastToggleTime > 0) {
            rapidToggleCount++;
            isRapidToggle = true;
            note = `⚠️ CONTRADICCIÓN DETECTADA: Toggle inverso en ${Math.round(timeSinceLastToggle)}ms!`;
            console.warn(`%c[DebugWatcher ALERT] #${targetId} alternó estado en ${Math.round(timeSinceLastToggle)}ms (ScrollY: ${window.scrollY}px)`, 'background:#ef4444; color:#fff; font-weight:bold; padding:2px 6px;');
          }
          lastToggleTime = now;
          lastClassState = currentCollapsed;
        }

        logs.push({
          timestamp: Date.now(),
          timeOffsetMs: Math.round(now - startTime),
          eventType: isRapidToggle ? 'MUTATION_RAPID_TOGGLE' : 'CLASS_MUTATION',
          classes: target.className,
          height: target.offsetHeight,
          scrollY: Math.round(window.scrollY),
          note,
        });

        updateHUD(note, isRapidToggle);
      }
    }
  });

  observer.observe(target, {
    attributes: true,
    attributeFilter: ['class', 'style'],
  });

  // 2. Monitoreo de Transiciones CSS
  const onTransitionStart = (e: TransitionEvent) => {
    if (e.target === target || target.contains(e.target as Node)) {
      const now = performance.now();
      logs.push({
        timestamp: Date.now(),
        timeOffsetMs: Math.round(now - startTime),
        eventType: 'TRANSITION_START',
        classes: target.className,
        height: target.offsetHeight,
        scrollY: Math.round(window.scrollY),
        note: `Inicio transición: ${e.propertyName} (${e.elapsedTime}s)`,
      });
      updateHUD(`Iniciando transición: ${e.propertyName}`);
    }
  };

  const onTransitionEnd = (e: TransitionEvent) => {
    if (e.target === target || target.contains(e.target as Node)) {
      const now = performance.now();
      logs.push({
        timestamp: Date.now(),
        timeOffsetMs: Math.round(now - startTime),
        eventType: 'TRANSITION_END',
        classes: target.className,
        height: target.offsetHeight,
        scrollY: Math.round(window.scrollY),
        note: `Fin transición: ${e.propertyName}`,
      });
      updateHUD(`Fin transición: ${e.propertyName}`);
    }
  };

  target.addEventListener('transitionstart', onTransitionStart as EventListener);
  target.addEventListener('transitionend', onTransitionEnd as EventListener);

  // 3. Monitoreo del Scroll y su impacto
  let scrollThrottle = false;
  const onScroll = () => {
    if (!scrollThrottle) {
      scrollThrottle = true;
      requestAnimationFrame(() => {
        updateHUD('Scrolling...');
        scrollThrottle = false;
      });
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // 4. Temporizador de 30 segundos para generar reporte forense completo
  const intervalId = setInterval(() => {
    updateHUD('Monitoreando...');
  }, 500);

  setTimeout(() => {
    clearInterval(intervalId);
    observer.disconnect();
    target.removeEventListener('transitionstart', onTransitionStart as EventListener);
    target.removeEventListener('transitionend', onTransitionEnd as EventListener);
    window.removeEventListener('scroll', onScroll);

    console.log(`%c[DebugWatcher] FIN DEL MONITOREO (30s COMPLETADOS)`, 'background: #065f46; color: #34d399; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
    console.log(`📊 RESUMEN FORENSE DE #${targetId}:`);
    console.log(`- Total mutaciones registradas: ${mutationCount}`);
    console.log(`- Toggles rápidos / Contradicciones (<350ms): ${rapidToggleCount}`);
    
    if (logs.length > 0) {
      console.log('Detalle de eventos:');
      console.table(logs);
    } else {
      console.log('No se registraron mutaciones de clases en este periodo.');
    }

    // Dejar disponible globalmente para inspección manual en consola DevTools
    (window as any).__debugWatcherLogs = logs;
    console.log('💡 Datos completos guardados en: window.__debugWatcherLogs');

    if (hud) {
      hud.style.borderColor = rapidToggleCount > 0 ? '#ef4444' : '#10b981';
      const lastEventEl = document.getElementById('hud-last-event');
      if (lastEventEl) {
        lastEventEl.innerHTML = rapidToggleCount > 0 
          ? `<span style="color:#ef4444; font-weight:bold;">❌ ${rapidToggleCount} TEMBLORES DETECTADOS (Ver Consola)</span>`
          : `<span style="color:#10b981; font-weight:bold;">✅ ESTABLE: 0 temblores detectados</span>`;
      }
      setTimeout(() => {
        hud.style.transition = 'opacity 1s';
        hud.style.opacity = '0.4';
      }, 5000);
    }
  }, durationSeconds * 1000);
}
