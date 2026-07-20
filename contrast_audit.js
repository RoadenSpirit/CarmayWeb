const puppeteer = require('puppeteer');

const CONFIG = {
    baseUrl: 'https://carmayoutfit.com',
    viewports: {
        desktop: { width: 1920, height: 1080 }
    }
};

// Función WCAG para calcular contraste en Node/Browser
async function runContrastAudit(page, urlName, url) {
    console.log(`Auditando contraste en: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 3000)); // Esperar renderizado

    const violations = await page.evaluate(() => {
        function getRelativeLuminance(rgbStr) {
            const rgb = rgbStr.match(/\d+/g);
            if (!rgb || rgb.length < 3) return 0;
            const r = parseInt(rgb[0]) / 255;
            const g = parseInt(rgb[1]) / 255;
            const b = parseInt(rgb[2]) / 255;

            const rS = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
            const gS = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
            const bS = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

            return 0.2126 * rS + 0.7152 * gS + 0.0722 * bS;
        }

        function getActualBackgroundColor(element) {
            let el = element;
            while (el) {
                const bg = window.getComputedStyle(el).backgroundColor;
                if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
                    return bg;
                }
                el = el.parentElement;
            }
            return 'rgb(255, 255, 255)';
        }

        const elements = document.querySelectorAll('body *');
        const results = [];

        elements.forEach(el => {
            // Filtrar solo elementos visibles con texto directo
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
                return;
            }

            // Verificar si el elemento tiene texto directo (no hijos vacíos)
            const textContent = Array.from(el.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.nodeValue.trim())
                .join('');

            if (textContent.length > 0) {
                const textColor = style.color;
                const bgColor = getActualBackgroundColor(el);

                const l1 = getRelativeLuminance(textColor);
                const l2 = getRelativeLuminance(bgColor);

                const lighter = Math.max(l1, l2);
                const darker = Math.min(l1, l2);
                const contrastRatio = (lighter + 0.05) / (darker + 0.05);

                // Si la relación de contraste es mala (< 3.0 para textos legibles)
                if (contrastRatio < 3.0) {
                    // Obtener selector simple para identificar el elemento
                    let selector = el.tagName.toLowerCase();
                    if (el.id) selector += `#${el.id}`;
                    if (el.className) selector += `.${Array.from(el.classList).join('.')}`;

                    results.push({
                        selector: selector,
                        text: textContent.substring(0, 50),
                        textColor: textColor,
                        backgroundColor: bgColor,
                        ratio: contrastRatio.toFixed(2)
                    });
                }
            }
        });

        return results;
    });

    console.log(`\n=== RESULTADO CONTRASTE PARA: ${urlName} ===`);
    if (violations.length === 0) {
        console.log("✓ Sin errores de contraste graves (relación < 3.0).");
    } else {
        console.log(`⚠️ Se encontraron ${violations.length} fallos de contraste:`);
        violations.slice(0, 15).forEach((v, index) => {
            console.log(`   [${index + 1}] Selector: ${v.selector}`);
            console.log(`       Texto: "${v.text}"`);
            console.log(`       Color texto: ${v.textColor} | Fondo: ${v.backgroundColor}`);
            console.log(`       Relación de contraste: ${v.ratio}:1`);
        });
        if (violations.length > 15) {
            console.log(`   ... y ${violations.length - 15} errores más.`);
        }
    }
}

async function run() {
    console.log("Iniciando auditoría de contraste en el contenedor...");
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setCacheEnabled(false);
    await page.setViewport(CONFIG.viewports.desktop);

    try {
        await runContrastAudit(page, 'INICIO', `${CONFIG.baseUrl}/?nocache=${Date.now()}`);
    } catch (e) {
        console.error("Error en auditoría:", e);
    } finally {
        await browser.close();
    }
}

run();
