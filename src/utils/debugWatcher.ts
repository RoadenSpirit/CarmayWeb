/**
 * Script de Diagnóstico Forense y Telemetría en Tiempo Real para Elementos DOM
 * Monitorea durante 30 segundos todas las mutaciones de clases, transiciones CSS,
 * eventos de scroll y micro-saltos de layout en un elemento por ID.
 * Transmite los logs en vivo a https://carmayn8n.cloud/webhook/carmay-telemetry
 */

const TELEMETRY_URL = 'https://carmayn8n.cloud/webhook/carmay-telemetry';

export function startElementWatcher(targetId: string, durationSeconds: number = 30) {
  if (typeof window === 'undefined') return;

  const target = document.getElementById(targetId);
  if (!target) {
    console.warn(`[DebugWatcher] Elemento con id "${targetId}" no encontrado.`);
    return;
  }

  const sessionId = 'ses_' + Math.random().toString(36).substring(2, 9);
  console.log(`%c[DebugWatcher] INICIANDO TELEMETRÍA REMOTA EN VIVO (${durationSeconds}s) [Session: ${sessionId}]...`, 'background: #1e1b4b; color: #fbbf24; font-weight: bold; padding: 4px 8px; border-radius: 4px;');

  // Panel visual HUD flotante en pantalla
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
      <span>🔍 TELEMETRÍA EN VIVO: #${targetId}</span>
      <span id="hud-timer">${durationSeconds}s</span>
    </div>
    <div id="hud-classes" style="color:#38bdf8; word-break:break-all;">Clases: ${target.className}</div>
    <div id="hud-stats" style="margin-top:4px; color:#a3e635;">Mutaciones: 0 | Toggles rápidos: 0</div>
    <div id="hud-scroll" style="color:#cbd5e1;">ScrollY: ${Math.round(window.scrollY)}px</div>
    <div id="hud-last-event" style="color:#f43f5e; margin-top:4px;">📡 Transmitiendo a n8n...</div>
  `;
  document.body.appendChild(hud);

  const logs: Array<{
    timeOffsetMs: number;
    eventType: string;
    classes: string;
    height: number;
    scrollY: number;
    note: string;
  }> = [];

  const pendingBatch: typeof logs = [];

  function sendTelemetry(batch: typeof logs, isFinal = false) {
    if (batch.length === 0 && !isFinal) return;
    const payload = {
      sessionId,
      targetId,
      isFinal,
      totalMutations: mutationCount,
      rapidToggles: rapidToggleCount,
      currentScrollY: Math.round(window.scrollY),
      events: [...batch],
      userAgent: navigator.userAgent,
    };

    fetch(TELEMETRY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch((e) => console.warn('[DebugWatcher] Error transmitiendo telemetría:', e.message));
  }

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
        let note = `Clase cambiada: is-collapsed=${currentCollapsed}`;

        if (currentCollapsed !== lastClassState) {
          const timeSinceLastToggle = now - lastToggleTime;
          if (timeSinceLastToggle < 400 && lastToggleTime > 0) {
            rapidToggleCount++;
            isRapidToggle = true;
            note = `⚠️ CONTRADICCIÓN: Toggle inverso en ${Math.round(timeSinceLastToggle)}ms!`;
            console.warn(`%c[DebugWatcher ALERT] #${targetId} alternó en ${Math.round(timeSinceLastToggle)}ms (ScrollY: ${window.scrollY}px)`, 'background:#ef4444; color:#fff; font-weight:bold;');
          }
          lastToggleTime = now;
          lastClassState = currentCollapsed;
        }

        const entry = {
          timeOffsetMs: Math.round(now - startTime),
          eventType: isRapidToggle ? 'RAPID_TOGGLE' : 'CLASS_MUTATION',
          classes: target.className,
          height: target.offsetHeight,
          scrollY: Math.round(window.scrollY),
          note,
        };

        logs.push(entry);
        pendingBatch.push(entry);
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
      const entry = {
        timeOffsetMs: Math.round(now - startTime),
        eventType: 'TRANSITION_START',
        classes: target.className,
        height: target.offsetHeight,
        scrollY: Math.round(window.scrollY),
        note: `Transición: ${e.propertyName}`,
      };
      logs.push(entry);
      pendingBatch.push(entry);
      updateHUD(`Transición iniciada: ${e.propertyName}`);
    }
  };

  const onTransitionEnd = (e: TransitionEvent) => {
    if (e.target === target || target.contains(e.target as Node)) {
      const now = performance.now();
      const entry = {
        timeOffsetMs: Math.round(now - startTime),
        eventType: 'TRANSITION_END',
        classes: target.className,
        height: target.offsetHeight,
        scrollY: Math.round(window.scrollY),
        note: `Fin Transición: ${e.propertyName}`,
      };
      logs.push(entry);
      pendingBatch.push(entry);
      updateHUD(`Transición terminada: ${e.propertyName}`);
    }
  };

  target.addEventListener('transitionstart', onTransitionStart as EventListener);
  target.addEventListener('transitionend', onTransitionEnd as EventListener);

  // 3. Muestreo periódico de Scroll y transmisión cada 2 segundos
  let lastSampleScrollY = window.scrollY;
  const syncInterval = setInterval(() => {
    const currentScrollY = window.scrollY;
    const diff = currentScrollY - lastSampleScrollY;
    if (Math.abs(diff) > 2) {
      const entry = {
        timeOffsetMs: Math.round(performance.now() - startTime),
        eventType: 'SCROLL_SAMPLE',
        classes: target.className,
        height: target.offsetHeight,
        scrollY: Math.round(currentScrollY),
        note: `Scroll Delta: ${diff > 0 ? '+' : ''}${Math.round(diff)}px`,
      };
      pendingBatch.push(entry);
      lastSampleScrollY = currentScrollY;
    }

    if (pendingBatch.length > 0) {
      sendTelemetry([...pendingBatch]);
      pendingBatch.length = 0;
    }

    updateHUD('Transmitiendo telemetría...');
  }, 1500);

  // 4. Finalización y reporte a los 30 segundos
  setTimeout(() => {
    clearInterval(syncInterval);
    observer.disconnect();
    target.removeEventListener('transitionstart', onTransitionStart as EventListener);
    target.removeEventListener('transitionend', onTransitionEnd as EventListener);

    // Envío final con todos los datos
    sendTelemetry(logs, true);

    console.log(`%c[DebugWatcher] FIN DEL MONITOREO (30s) — TELEMETRÍA ENVIADA A N8N`, 'background: #065f46; color: #34d399; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
    console.table(logs);

    (window as any).__debugWatcherLogs = logs;

    if (hud) {
      hud.style.borderColor = rapidToggleCount > 0 ? '#ef4444' : '#10b981';
      const lastEventEl = document.getElementById('hud-last-event');
      if (lastEventEl) {
        lastEventEl.innerHTML = rapidToggleCount > 0 
          ? `<span style="color:#ef4444; font-weight:bold;">❌ ${rapidToggleCount} TEMBLORES ENVIADOS A LOGS</span>`
          : `<span style="color:#10b981; font-weight:bold;">✅ TELEMETRÍA ENVIADA (0 contradicciones)</span>`;
      }
    }
  }, durationSeconds * 1000);
}
