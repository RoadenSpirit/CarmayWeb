const puppeteer = require('puppeteer');

async function run() {
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://carmayoutfit.com/', { waitUntil: 'networkidle2' });

    const info = await page.evaluate(() => {
        const titleLink = document.querySelector('a.woocommerce-LoopProduct-link');
        if (!titleLink) return 'No se encontró el enlace de título de producto';

        const style = window.getComputedStyle(titleLink);
        
        // Buscar de dónde viene el color subiendo en el árbol
        const hierarchy = [];
        let current = titleLink;
        while (current) {
            let desc = current.tagName.toLowerCase();
            if (current.id) desc += `#${current.id}`;
            if (current.className) desc += `.${Array.from(current.classList).join('.')}`;
            hierarchy.push({
                element: desc,
                color: window.getComputedStyle(current).color,
                bgColor: window.getComputedStyle(current).backgroundColor
            });
            current = current.parentElement;
        }

        return {
            hierarchy,
            computedColor: style.color,
            computedBg: style.backgroundColor
        };
    });

    console.log(JSON.stringify(info, null, 2));
    await browser.close();
}

run();
