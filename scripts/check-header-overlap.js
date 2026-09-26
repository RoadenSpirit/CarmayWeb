const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const routes = ['/', '/tienda/', '/contact', '/finalizar-pedido/', '/producto/sandalias-carmelitas-con-lazo-y-perlas/'];
  const viewports = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'desktop', width: 1280, height: 800 }
  ];

  console.log('--- DIAGNÓSTICO DE SOLAPAMIENTO DE HEADER ---');

  for (const vp of viewports) {
    console.log(`\n=== VIEWPORT: ${vp.name} (${vp.width}x${vp.height}) ===`);
    const page = await browser.newPage({ viewport: vp });

    for (const route of routes) {
      await page.goto(`http://172.16.1.1:4321${route}`, { waitUntil: 'networkidle' });

      const metrics = await page.evaluate(() => {
        const header = document.querySelector('header');
        const headerRect = header ? header.getBoundingClientRect() : null;
        
        // Primer elemento visible después del header
        const allElements = Array.from(document.body.children);
        const headerIndex = allElements.indexOf(header);
        let firstContentEl = null;

        for (let i = headerIndex + 1; i < allElements.length; i++) {
          const el = allElements[i];
          if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.id === 'cart-overlay' || el.id === 'cart-drawer' || el.id === 'carmay-floating-cart') continue;
          const rect = el.getBoundingClientRect();
          if (rect.height > 0) {
            firstContentEl = {
              tag: el.tagName,
              id: el.id,
              class: el.className ? el.className.slice(0, 40) : '',
              top: Math.round(rect.top),
              bottom: Math.round(rect.bottom),
              height: Math.round(rect.height)
            };
            break;
          }
        }

        // Buscar el primer H1
        const h1 = document.querySelector('h1');
        const h1Rect = h1 ? h1.getBoundingClientRect() : null;

        return {
          headerBottom: headerRect ? Math.round(headerRect.bottom) : 0,
          headerHeight: headerRect ? Math.round(headerRect.height) : 0,
          firstContentEl,
          h1: h1Rect ? {
            text: h1.innerText.slice(0, 30),
            top: Math.round(h1Rect.top),
            bottom: Math.round(h1Rect.bottom),
            isUnderHeader: headerRect ? h1Rect.top < headerRect.bottom : false
          } : null
        };
      });

      console.log(`${route}: Header bottom=${metrics.headerBottom}px (height=${metrics.headerHeight}px) | FirstEl top=${metrics.firstContentEl?.top}px | H1 top=${metrics.h1?.top}px (isUnderHeader=${metrics.h1?.isUnderHeader})`);
    }
    await page.close();
  }

  await browser.close();
})();
