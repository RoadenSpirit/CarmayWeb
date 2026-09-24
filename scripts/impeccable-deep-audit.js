const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const BASE_URL = process.env.AUDIT_BASE_URL || 'https://aqua-raven-173850.hostingersite.com';
  const routes = ['/', '/tienda/', '/tienda/ropa/', '/producto/sandalias-carmelitas-con-lazo-y-perlas/', '/contact', '/finalizar-pedido/'];

  console.log('STARTING UNCOMPROMISING IMPECCABLE AUDIT ACROSS ALL ROUTES...');

  const auditResults = {};

  for (const route of routes) {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();
    const url = `${BASE_URL}${route}`;
    await page.goto(url, { waitUntil: 'networkidle' });

    console.log(`Auditing ${route} on mobile (375px)...`);

    const pageAudit = await page.evaluate(() => {
      // 1. Gradient text detection
      const gradientTexts = [];
      document.querySelectorAll('h1, h2, h3, h4, h5, h6, span, p').forEach(el => {
        const style = window.getComputedStyle(el);
        const webkitBgClip = style.webkitBackgroundClip || style.backgroundClip;
        if (webkitBgClip === 'text') {
          gradientTexts.push({
            tag: el.tagName,
            text: el.innerText.trim().slice(0, 50),
            bgImage: style.backgroundImage.slice(0, 60)
          });
        }
      });

      // 2. Eyebrow / kicker labels directly above headings
      const eyebrows = [];
      document.querySelectorAll('h1, h2, h3').forEach(heading => {
        const prev = heading.previousElementSibling;
        if (prev && (prev.tagName === 'SPAN' || prev.tagName === 'P')) {
          const s = window.getComputedStyle(prev);
          if (s.textTransform === 'uppercase' && (s.letterSpacing !== 'normal' || s.fontSize.includes('10px') || s.fontSize.includes('11px') || s.fontSize.includes('12px'))) {
            eyebrows.push({
              headingText: heading.innerText.trim().slice(0, 40),
              eyebrowText: prev.innerText.trim().slice(0, 40)
            });
          }
        }
      });

      // 3. Emojis standing in for real icons
      const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
      const emojiIcons = [];
      document.querySelectorAll('button, a, .badge, [role="button"]').forEach(el => {
        const text = el.innerText || '';
        const match = text.match(emojiRegex);
        if (match) {
          emojiIcons.push({
            tag: el.tagName,
            emoji: match[0],
            text: text.slice(0, 40).replace(/\n/g, ' ')
          });
        }
      });

      // 4. Touch targets < 44px
      const smallTouchTargets = [];
      document.querySelectorAll('button, a, input, select, textarea').forEach(el => {
        let rect = el.getBoundingClientRect();
        const s = window.getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return;
        if (rect.width === 0 || rect.height === 0) return;

        // Radio/checkbox inputs are inside labels — the label is the real touch target
        if (el.matches('input[type="radio"], input[type="checkbox"]')) {
          const label = el.closest('label');
          if (label) rect = label.getBoundingClientRect();
        }

        if (rect.width < 44 || rect.height < 44) {
          smallTouchTargets.push({
            tag: el.tagName,
            text: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').slice(0, 30).trim(),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          });
        }
      });

      // 5. Typography check: text < 12px and font families applied
      const microFonts = [];
      const fontsUsed = new Set();
      document.querySelectorAll('*').forEach(el => {
        if (el.children.length === 0 && el.innerText && el.innerText.trim().length > 0) {
          const s = window.getComputedStyle(el);
          const fontSize = parseFloat(s.fontSize);
          fontsUsed.add(s.fontFamily);
          if (fontSize < 12) {
            microFonts.push({
              tag: el.tagName,
              text: el.innerText.trim().slice(0, 30),
              size: s.fontSize,
              lineHeight: s.lineHeight
            });
          }
        }
      });

      // 6. will-change left permanently on
      const willChangeElements = [];
      document.querySelectorAll('*').forEach(el => {
        const wc = window.getComputedStyle(el).willChange;
        if (wc && wc !== 'auto') {
          willChangeElements.push({
            tag: el.tagName,
            id: el.id || '',
            willChange: wc
          });
        }
      });

      return {
        gradientTexts,
        eyebrows,
        emojiIcons: emojiIcons.slice(0, 10),
        smallTouchTargetsCount: smallTouchTargets.length,
        smallTouchTargetsSample: smallTouchTargets.slice(0, 8),
        microFontsCount: microFonts.length,
        microFontsSample: microFonts.slice(0, 8),
        fontsUsed: Array.from(fontsUsed),
        willChangeElements
      };
    });

    auditResults[route] = pageAudit;
    await context.close();
  }

  console.log('DEEP AUDIT COMPLETED. FULL RESULTS:');
  console.log(JSON.stringify(auditResults, null, 2));

  await browser.close();
})();
