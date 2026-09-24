const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const BASE_URL = 'https://aqua-raven-173850.hostingersite.com';
  console.log(`Starting E2E Audit for Stage 2 (Tienda & Filtros) on ${BASE_URL}/tienda/...`);

  const report = {
    target: `${BASE_URL}/tienda/`,
    timestamp: new Date().toISOString(),
    viewports: {},
    categorySubroute: {},
    filterInteractions: {},
    searchSync: {},
    emptyStateTest: {},
    productCards: {},
    consoleMessages: [],
    pageErrors: [],
    failedRequests: []
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

  // ===================== 1. DESKTOP TIENDA VIEWPORT (1440x900) =====================
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/tienda/`, { waitUntil: 'networkidle' });

  const desktopTitle = await page.title();
  const totalCardsDesktop = await page.$$eval('.product-card-item', els => els.length);
  const initialCountText = await page.$eval('#filter-results-count', el => el.innerText.trim());

  report.viewports.desktop = {
    title: desktopTitle,
    totalCards: totalCardsDesktop,
    initialCountText,
    scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth),
    innerWidth: 1440,
    overflows: await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  };

  // ===================== 2. MOBILE TIENDA VIEWPORT (375x812) =====================
  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload({ waitUntil: 'networkidle' });

  const mobileOverflow = await page.evaluate(() => {
    const sw = document.documentElement.scrollWidth;
    const iw = window.innerWidth;
    return {
      scrollWidth: sw,
      innerWidth: iw,
      overflows: sw > iw
    };
  });

  report.viewports.mobile = mobileOverflow;

  // Touch targets check on filter bar and product cards in mobile
  const filterTouchTargets = await page.evaluate(() => {
    const smallTargets = [];
    const elements = document.querySelectorAll('#catalog-filter-bar button, #catalog-filter-bar input, .product-card-item a, .product-card-item button');

    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;
      if (rect.width === 0 || rect.height === 0) return;

      if (rect.width < 40 || rect.height < 40) {
        smallTargets.push({
          tag: el.tagName,
          text: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || '').slice(0, 30).trim(),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          className: (el.className || '').toString().slice(0, 50)
        });
      }
    });

    return {
      totalAudited: elements.length,
      smallCount: smallTargets.length,
      sampleSmall: smallTargets.slice(0, 5)
    };
  });

  report.viewports.mobileTouchTargets = filterTouchTargets;

  // ===================== 3. CATEGORY SUB-ROUTE (/tienda/zapatos/) =====================
  console.log('Testing category sub-route /tienda/zapatos/...');
  await page.goto(`${BASE_URL}/tienda/zapatos/`, { waitUntil: 'networkidle' });

  const catTitle = await page.title();
  const catCardsCount = await page.$$eval('.product-card-item', els => els.length);
  const activeCategoryHighlighted = await page.$eval('#categorias-navbar a[href="/tienda/zapatos/"]', el => {
    return el.className.includes('text-yellow-400') && el.className.includes('bg-yellow-400/10');
  });

  report.categorySubroute = {
    url: `${BASE_URL}/tienda/zapatos/`,
    title: catTitle,
    totalCards: catCardsCount,
    activeCategoryHighlighted,
    mobileScrollWidth: await page.evaluate(() => document.documentElement.scrollWidth),
    mobileOverflows: await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  };

  // ===================== 4. FILTER INTERACTIONS (/tienda/) =====================
  console.log('Testing filter interactions on /tienda/...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/tienda/`, { waitUntil: 'networkidle' });

  // Test Tag: "En Rebaja"
  const tagSaleBtn = await page.$('#filter-tag-sale');
  let saleFilteredCount = 0;
  if (tagSaleBtn) {
    await tagSaleBtn.click();
    await page.waitForTimeout(300);
    saleFilteredCount = await page.$$eval('.product-card-item', els => els.filter(e => e.style.display !== 'none').length);
    const countLabelSale = await page.$eval('#filter-results-count', el => el.innerText.trim());
    const resetVisible = await page.$eval('#filter-reset-btn', el => !el.classList.contains('hidden'));

    report.filterInteractions.saleTag = {
      active: true,
      visibleCards: saleFilteredCount,
      countLabel: countLabelSale,
      resetButtonVisible: resetVisible
    };

    // Toggle off
    await tagSaleBtn.click();
    await page.waitForTimeout(300);
  }

  // Test Tag: "Tendencias"
  const tagTrendingBtn = await page.$('#filter-tag-trending');
  if (tagTrendingBtn) {
    await tagTrendingBtn.click();
    await page.waitForTimeout(300);
    const trendingFilteredCount = await page.$$eval('.product-card-item', els => els.filter(e => e.style.display !== 'none').length);

    report.filterInteractions.trendingTag = {
      active: true,
      visibleCards: trendingFilteredCount
    };

    // Reset via Reset Button
    await page.click('#filter-reset-btn');
    await page.waitForTimeout(300);
  }

  // ===================== 5. ACTIVE SEARCH QUERY SYNC (/tienda/?s=sandalias) =====================
  console.log('Testing URL search query synchronization /tienda/?s=sandalias...');
  await page.goto(`${BASE_URL}/tienda/?s=sandalias`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const subnavInputValue = await page.$eval('#subnav-search-input', el => el.value);
  const searchBadgeVisible = await page.$eval('#filter-search-badge', el => !el.classList.contains('hidden'));
  const searchBadgeText = await page.$eval('#filter-search-query-text', el => el.innerText.trim());
  const searchFilteredCards = await page.$$eval('.product-card-item', els => els.filter(e => e.style.display !== 'none').length);
  const searchCountLabel = await page.$eval('#filter-results-count', el => el.innerText.trim());

  // Click clear search badge
  await page.click('#filter-search-clear-badge');
  await page.waitForTimeout(400);

  const cardsAfterClearSearch = await page.$$eval('.product-card-item', els => els.filter(e => e.style.display !== 'none').length);
  const subnavInputAfterClear = await page.$eval('#subnav-search-input', el => el.value);

  report.searchSync = {
    queryParam: 'sandalias',
    inputAutoFilled: subnavInputValue === 'sandalias',
    searchBadgeVisible,
    searchBadgeText,
    searchFilteredCards,
    searchCountLabel,
    clearedSuccessfully: cardsAfterClearSearch > searchFilteredCards && subnavInputAfterClear === ''
  };

  // ===================== 6. EMPTY STATE TEST =====================
  console.log('Testing empty state fallback...');
  // Set price inputs to impossible range
  await page.fill('#price-min-input', '349999');
  await page.fill('#price-max-input', '350000');
  await page.waitForTimeout(400);

  const emptyStateVisible = await page.$eval('#filter-empty-state', el => !el.classList.contains('hidden'));
  const emptyStateTitle = await page.$eval('#filter-empty-state h3', el => el.innerText.trim());
  const emptyStateBtnVisible = await page.$eval('#empty-state-reset-btn', el => !el.classList.contains('hidden'));

  // Click reset in empty state
  await page.click('#empty-state-reset-btn');
  await page.waitForTimeout(400);

  const restoredCardsCount = await page.$$eval('.product-card-item', els => els.filter(e => e.style.display !== 'none').length);

  report.emptyStateTest = {
    emptyStateTriggered: emptyStateVisible,
    emptyStateTitle,
    emptyStateBtnVisible,
    restoredAfterReset: restoredCardsCount > 0,
    restoredCardsCount
  };

  // ===================== 7. PRODUCT CARDS AUDIT =====================
  console.log('Auditing product cards structure...');
  const cardSample = await page.evaluate(() => {
    const card = document.querySelector('.product-card-item');
    if (!card) return null;

    const img = card.querySelector('img');
    const title = card.querySelector('h3');
    const priceCUP = card.getAttribute('data-price-cup');
    const priceUSD = card.getAttribute('data-price-usd');
    const onSale = card.getAttribute('data-on-sale');
    const inStock = card.getAttribute('data-in-stock');

    return {
      hasImage: !!img && !!img.getAttribute('src'),
      imageLoading: img?.getAttribute('loading'),
      hasTitle: !!title && title.innerText.length > 0,
      priceCUP,
      priceUSD,
      onSale,
      inStock,
      hasQuickAdd: !!card.querySelector('[data-quick-add], .quick-add-btn')
    };
  });

  report.productCards = cardSample;

  console.log('AUDIT STAGE 2 COMPLETE:');
  console.log(JSON.stringify(report, null, 2));

  await browser.close();
})();
