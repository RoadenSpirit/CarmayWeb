const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const TARGET_URL = 'https://aqua-raven-173850.hostingersite.com/';
  console.log(`Starting E2E Audit for Stage 1 (Index) on ${TARGET_URL}...`);

  const report = {
    target: TARGET_URL,
    timestamp: new Date().toISOString(),
    viewports: {},
    consoleMessages: [],
    pageErrors: [],
    failedRequests: [],
    domAudits: {},
    searchInteraction: {},
    scrollBehavior: {}
  };

  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      report.consoleMessages.push({ type: msg.type(), text: msg.text() });
    }
  });

  page.on('pageerror', err => {
    report.pageErrors.push(err.message);
  });

  page.on('requestfailed', req => {
    report.failedRequests.push({ url: req.url(), failure: req.failure()?.errorText });
  });

  // ===================== 1. DESKTOP VIEWPORT (1440x900) =====================
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });

  const desktopTitle = await page.title();
  const desktopOverflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    overflows: document.documentElement.scrollWidth > window.innerWidth
  }));

  report.viewports.desktop = {
    title: desktopTitle,
    ...desktopOverflow
  };

  // ===================== 2. MOBILE VIEWPORT (375x812) =====================
  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload({ waitUntil: 'networkidle' });

  const mobileOverflow = await page.evaluate(() => {
    const sw = document.documentElement.scrollWidth;
    const iw = window.innerWidth;
    const overflowingElements = [];

    document.querySelectorAll('*').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > iw + 2) {
        overflowingElements.push({
          tag: el.tagName,
          id: el.id || '',
          className: (el.className || '').toString().slice(0, 80),
          right: Math.round(rect.right),
          width: Math.round(rect.width)
        });
      }
    });

    return {
      scrollWidth: sw,
      innerWidth: iw,
      overflows: sw > iw,
      overflowCount: overflowingElements.length,
      sampleOverflows: overflowingElements.slice(0, 5)
    };
  });

  report.viewports.mobile = mobileOverflow;

  // ===================== 3. MOBILE TOUCH TARGETS (< 44px) =====================
  const touchTargets = await page.evaluate(() => {
    const smallTargets = [];
    const elements = document.querySelectorAll('button, a, input, select');

    elements.forEach(el => {
      // Ignore hidden or zero-size elements
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;
      if (rect.width === 0 || rect.height === 0) return;

      const isTooSmall = rect.width < 40 || rect.height < 40;
      if (isTooSmall) {
        smallTargets.push({
          tag: el.tagName,
          text: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || '').slice(0, 30).trim(),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          className: (el.className || '').toString().slice(0, 60)
        });
      }
    });

    return {
      totalInteractive: elements.length,
      smallCount: smallTargets.length,
      samples: smallTargets.slice(0, 8)
    };
  });

  report.domAudits.touchTargets = touchTargets;

  // ===================== 4. TYPOGRAPHY & CONTRAST SAMPLE =====================
  const typography = await page.evaluate(() => {
    const sampleH1 = document.querySelector('h1');
    const sampleH2 = document.querySelector('h2');
    const sampleBody = document.querySelector('p');
    const priceText = document.querySelector('.text-orange-400, .text-amber-400');

    return {
      h1: sampleH1 ? {
        fontFamily: window.getComputedStyle(sampleH1).fontFamily,
        fontSize: window.getComputedStyle(sampleH1).fontSize,
        lineHeight: window.getComputedStyle(sampleH1).lineHeight
      } : null,
      h2: sampleH2 ? {
        fontFamily: window.getComputedStyle(sampleH2).fontFamily,
        fontSize: window.getComputedStyle(sampleH2).fontSize,
        lineHeight: window.getComputedStyle(sampleH2).lineHeight
      } : null,
      body: sampleBody ? {
        fontFamily: window.getComputedStyle(sampleBody).fontFamily,
        fontSize: window.getComputedStyle(sampleBody).fontSize,
        color: window.getComputedStyle(sampleBody).color
      } : null,
      accentPrice: priceText ? {
        color: window.getComputedStyle(priceText).color
      } : null
    };
  });

  report.domAudits.typography = typography;

  // ===================== 5. IMAGES & ACCESSIBILITY AUDIT =====================
  const imagesAudit = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    let missingAlt = 0;
    let emptySrc = 0;

    imgs.forEach(img => {
      if (!img.getAttribute('alt')) missingAlt++;
      if (!img.getAttribute('src')) emptySrc++;
    });

    return {
      totalImages: imgs.length,
      missingAlt,
      emptySrc
    };
  });

  report.domAudits.images = imagesAudit;

  // ===================== 6. SEARCH & AUTOCOMPLETE INTERACTION =====================
  console.log('Testing search autocomplete interaction...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });

  // Type in search bar
  const searchInput = await page.$('#subnav-search-input');
  if (searchInput) {
    await searchInput.fill('sandalias');
    await page.waitForTimeout(600); // Wait for 140ms debounce + render

    const panelVisible = await page.$eval('#subnav-search-panel', el => !el.classList.contains('hidden'));
    const cardsRendered = await page.$$eval('#subnav-search-panel a', els => els.length);
    const panelComputed = await page.$eval('#subnav-search-panel', el => {
      const s = window.getComputedStyle(el);
      return {
        backgroundColor: s.backgroundColor,
        borderRadius: s.borderRadius,
        boxShadow: s.boxShadow,
        width: el.offsetWidth,
        height: el.offsetHeight
      };
    });

    report.searchInteraction.match = {
      query: 'sandalias',
      panelVisible,
      cardsRendered,
      panelComputed
    };

    // Test zero results fallback
    await searchInput.fill('xyznomatchtest');
    await page.waitForTimeout(600);

    const zeroPanelVisible = await page.$eval('#subnav-search-panel', el => !el.classList.contains('hidden'));
    const whatsappBtn = await page.$eval('#subnav-search-panel a', el => ({
      text: el.innerText,
      href: el.getAttribute('href')
    }));
    const recommendedCardsCount = await page.$$eval('#subnav-search-panel .grid a', els => els.length);

    report.searchInteraction.zeroResults = {
      query: 'xyznomatchtest',
      panelVisible: zeroPanelVisible,
      whatsappBtn,
      recommendedCardsCount
    };
  }

  // ===================== 7. SCROLL COLLAPSE PHYSICS =====================
  console.log('Testing scroll physics...');
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(600);

  const isCollapsedAfterScrollDown = await page.$eval('#subnav-collapsible', el => el.classList.contains('is-collapsed'));

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);

  const isExpandedAfterScrollTop = await page.$eval('#subnav-collapsible', el => !el.classList.contains('is-collapsed'));

  report.scrollBehavior = {
    collapsedOnScrollDown: isCollapsedAfterScrollDown,
    expandedOnScrollTop: isExpandedAfterScrollTop
  };

  console.log('AUDIT COMPLETE. Results:');
  console.log(JSON.stringify(report, null, 2));

  await browser.close();
})();
