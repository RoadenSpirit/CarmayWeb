const puppeteer = require('puppeteer');

async function run() {
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://carmayoutfit.com/?nocache=' + Date.now(), { waitUntil: 'networkidle2' });

    const result = await page.evaluate(() => {
        const el = document.querySelector('h1.stk-block-heading__text');
        if (!el) return 'Hero H1 not found';

        const style = window.getComputedStyle(el);
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

        return {
            text: el.textContent,
            color: style.color,
            bgColor: style.backgroundColor,
            matchedRules
        };
    });

    console.log(JSON.stringify(result, null, 2));
    await browser.close();
}

run();
