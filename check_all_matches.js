const puppeteer = require('puppeteer');

async function run() {
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://carmayoutfit.com/', { waitUntil: 'networkidle2' });

    const results = await page.evaluate(() => {
        const testElements = [
            { name: 'HERO H1', query: 'h1.stk-block-heading__text' },
            { name: 'CATEGORY BOLSOS', query: '#bolsos-y-mochilas h3' },
            { name: 'CATEGORY ROPA', query: 'h3.stk-block-heading__text' }
        ];

        return testElements.map(t => {
            const el = document.querySelector(t.query);
            if (!el) return { name: t.name, status: 'Not found' };

            const style = window.getComputedStyle(el);
            
            // Buscar todas las reglas CSS que se aplican
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
                } catch (e) {}
            }

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
                name: t.name,
                text: el.textContent,
                color: style.color,
                bgColor: style.backgroundColor,
                hierarchy,
                matchedRules
            };
        });
    });

    console.log(JSON.stringify(results, null, 2));
    await browser.close();
}

run();
