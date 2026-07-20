const puppeteer = require('puppeteer');

async function run() {
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Habilitar CSS coverage o inspección de estilos
    const client = await page.target().createCDPSession();
    await client.send('DOM.enable');
    await client.send('CSS.enable');

    await page.goto('https://carmayoutfit.com/', { waitUntil: 'networkidle2' });

    const result = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('h5.stk-block-heading__text'));
        const el = elements.find(e => e.textContent.includes('Tu Satisfacción es Nuestra Meta'));
        if (!el) return 'No element';
        
        // Obtener todas las reglas CSS que se aplican
        const sheets = document.styleSheets;
        const matchedRules = [];
        for (let i = 0; i < sheets.length; i++) {
            try {
                const rules = sheets[i].cssRules || sheets[i].rules;
                if (!rules) continue;
                for (let j = 0; j < rules.length; j++) {
                    if (rules[j].selectorText && el.matches(rules[j].selectorText)) {
                        matchedRules.push({
                            selector: rules[j].selectorText,
                            cssText: rules[j].cssText,
                            href: sheets[i].href || 'inline'
                        });
                    }
                }
            } catch (e) {
                // cross-origin stylesheets might throw error
            }
        }
        
        // Buscar ancestros
        const hierarchy = [];
        let current = el;
        while (current) {
            let desc = current.tagName.toLowerCase();
            if (current.id) desc += `#${current.id}`;
            if (current.className) desc += `.${Array.from(current.classList).join('.')}`;
            hierarchy.push(desc);
            current = current.parentElement;
        }

        return {
            hierarchy,
            matchedRules,
            color: window.getComputedStyle(el).color,
            bgColor: window.getComputedStyle(el).backgroundColor
        };
    });

    console.log(JSON.stringify(result, null, 2));
    await browser.close();
}

run();
