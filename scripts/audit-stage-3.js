const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const BASE_URL = 'https://aqua-raven-173850.hostingersite.com';
  console.log(`Starting E2E Audit for Stage 3 (Contact & Checkout) on ${BASE_URL}...`);

  const report = {
    timestamp: new Date().toISOString(),
    contactPage: {},
    checkoutPage: {},
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

  // ===================== 1. CONTACT PAGE AUDIT (/contact) =====================
  console.log('Auditing /contact desktop and mobile...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/contact`, { waitUntil: 'networkidle' });

  const contactTitle = await page.title();
  const desktopIllustrationVisible = await page.$eval('img[src="/atencion-cliente.png"]', el => {
    const s = window.getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden';
  });

  // Check contact channels and links
  const contactLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href^="https://wa.me"], a[href^="tel:"], a[href^="mailto:"]'));
    return links.map(l => ({
      href: l.getAttribute('href'),
      text: l.innerText.trim().slice(0, 40)
    }));
  });

  // Mobile check on /contact (375x812)
  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload({ waitUntil: 'networkidle' });

  const contactMobileOverflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    overflows: document.documentElement.scrollWidth > window.innerWidth
  }));

  const mobileIllustrationHidden = await page.$eval('img[src="/atencion-cliente.png"]', el => {
    const parentContainer = el.closest('.lg\\:flex');
    const s = parentContainer ? window.getComputedStyle(parentContainer) : window.getComputedStyle(el);
    return s.display === 'none';
  });

  report.contactPage = {
    url: `${BASE_URL}/contact`,
    title: contactTitle,
    desktopIllustrationVisible,
    mobileIllustrationOptimized: mobileIllustrationHidden,
    contactLinks,
    mobileScrollWidth: contactMobileOverflow.scrollWidth,
    mobileOverflows: contactMobileOverflow.overflows
  };

  // ===================== 2. CHECKOUT PAGE AUDIT (/finalizar-pedido/) =====================
  console.log('Auditing /finalizar-pedido/ empty state and filled state...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/finalizar-pedido/`, { waitUntil: 'networkidle' });

  const checkoutTitle = await page.title();

  // Test empty state
  const emptyStateVisible = await page.$eval('#checkout-empty', el => !el.classList.contains('hidden'));
  const contentHiddenWhenEmpty = await page.$eval('#checkout-content', el => el.classList.contains('hidden'));

  // Inject a mock cart item into localStorage
  await page.evaluate(() => {
    const mockCart = [
      {
        productId: 4999,
        slug: 'maquina-corta-pelo-electrica-2026',
        name: 'MAQUINA CORTA PELO ELECTRICA 2026',
        image: 'https://carmayoutfit.com/wp-content/uploads/2026/08/uc-1.webp',
        priceUSD: 18,
        priceCUP: 12600,
        quantity: 1,
        color: 'Negro',
        size: 'Estándar'
      }
    ];
    localStorage.setItem('carmay_cart_v1', JSON.stringify(mockCart));
  });

  // Reload with item in cart
  await page.reload({ waitUntil: 'networkidle' });

  const contentVisibleWithItem = await page.$eval('#checkout-content', el => !el.classList.contains('hidden'));
  const ticketCount = await page.$eval('#ticket-items-count', el => el.innerText.trim());
  const ticketSubtotal = await page.$eval('#ticket-subtotal', el => el.innerText.trim());

  // Test Delivery checkbox toggle
  const deliveryCheckbox = await page.$('#delivery-checkbox');
  await deliveryCheckbox.click();
  await page.waitForTimeout(300);

  const deliveryFieldsVisible = await page.$eval('#delivery-fields', el => !el.classList.contains('hidden'));
  const pickupInfoHidden = await page.$eval('#pickup-info', el => el.classList.contains('hidden'));
  const ticketDeliveryText = await page.$eval('#ticket-delivery', el => el.innerText.trim());

  // Uncheck delivery
  await deliveryCheckbox.click();
  await page.waitForTimeout(300);
  const pickupInfoRestored = await page.$eval('#pickup-info', el => !el.classList.contains('hidden'));

  // Test Currency switch (USD)
  const usdBtn = await page.$('button[data-currency="USD"]');
  await usdBtn.click();
  await page.waitForTimeout(300);

  const usdTotal = await page.$eval('#ticket-total', el => el.innerText.trim());
  const paymentUsdVisible = await page.$eval('#payment-options-usd', el => !el.classList.contains('hidden'));

  // Switch back to CUP
  const cupBtn = await page.$('button[data-currency="CUP"]');
  await cupBtn.click();
  await page.waitForTimeout(300);

  const cupTotal = await page.$eval('#ticket-total', el => el.innerText.trim());

  // Test Form Validation Error trigger (empty inputs)
  const submitBtn = await page.$('#submit-order-btn');
  await submitBtn.click();
  await page.waitForTimeout(300);

  const errorVisibleOnEmptySubmit = await page.$eval('#checkout-error', el => !el.classList.contains('hidden'));

  // Mobile check on /finalizar-pedido/ (375x812)
  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload({ waitUntil: 'networkidle' });

  const checkoutMobileOverflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    overflows: document.documentElement.scrollWidth > window.innerWidth
  }));

  const checkoutTouchTargets = await page.evaluate(() => {
    const smallTargets = [];
    const elements = document.querySelectorAll('#checkout-content input, #checkout-content button, #checkout-content label');

    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;
      if (rect.width === 0 || rect.height === 0) return;

      if (rect.width < 40 || rect.height < 40) {
        smallTargets.push({
          tag: el.tagName,
          text: (el.innerText || el.getAttribute('placeholder') || '').slice(0, 30).trim(),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
      }
    });

    return {
      totalAudited: elements.length,
      smallCount: smallTargets.length,
      sampleSmall: smallTargets.slice(0, 5)
    };
  });

  report.checkoutPage = {
    url: `${BASE_URL}/finalizar-pedido/`,
    title: checkoutTitle,
    emptyStateWorking: emptyStateVisible && contentHiddenWhenEmpty,
    itemStateWorking: contentVisibleWithItem,
    ticketCount,
    ticketSubtotal,
    deliveryToggleWorking: deliveryFieldsVisible && pickupInfoHidden && pickupInfoRestored,
    ticketDeliveryText,
    currencySwitchUSDWorking: usdTotal.includes('USD') && paymentUsdVisible,
    currencySwitchCUPWorking: cupTotal.includes('CUP'),
    validationErrorTriggered: errorVisibleOnEmptySubmit,
    mobileScrollWidth: checkoutMobileOverflow.scrollWidth,
    mobileOverflows: checkoutMobileOverflow.overflows,
    mobileTouchTargets: checkoutTouchTargets
  };

  console.log('STAGE 3 AUDIT COMPLETE:');
  console.log(JSON.stringify(report, null, 2));

  await browser.close();
})();
