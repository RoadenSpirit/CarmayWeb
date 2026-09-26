const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  
  await page.goto('http://172.16.1.1:4321/', { waitUntil: 'networkidle' });
  const homeMetrics = await page.evaluate(() => {
    const h = document.querySelector('header');
    const hero = document.querySelector('section');
    const logo = hero ? hero.querySelector('img') : null;
    return {
      headerRect: h.getBoundingClientRect(),
      heroRect: hero ? hero.getBoundingClientRect() : null,
      logoRect: logo ? logo.getBoundingClientRect() : null
    };
  });
  console.log('Home metrics:', JSON.stringify(homeMetrics, null, 2));

  await page.goto('http://172.16.1.1:4321/tienda/', { waitUntil: 'networkidle' });
  const tiendaMetrics = await page.evaluate(() => {
    const h = document.querySelector('header');
    const h1 = document.querySelector('h1');
    const catSection = document.querySelector('#categorias-section');
    return {
      headerRect: h.getBoundingClientRect(),
      h1Rect: h1 ? h1.getBoundingClientRect() : null,
      catSectionRect: catSection ? catSection.getBoundingClientRect() : null
    };
  });
  console.log('Tienda metrics:', JSON.stringify(tiendaMetrics, null, 2));

  await page.goto('http://172.16.1.1:4321/contact', { waitUntil: 'networkidle' });
  const contactMetrics = await page.evaluate(() => {
    const h = document.querySelector('header');
    const h1 = document.querySelector('h1');
    const breadcrumb = document.querySelector('nav');
    return {
      headerRect: h.getBoundingClientRect(),
      h1Rect: h1 ? h1.getBoundingClientRect() : null,
      breadcrumbRect: breadcrumb ? breadcrumb.getBoundingClientRect() : null
    };
  });
  console.log('Contact metrics:', JSON.stringify(contactMetrics, null, 2));

  await browser.close();
})();
