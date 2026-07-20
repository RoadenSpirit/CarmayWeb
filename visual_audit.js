const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const CONFIG = {
    baseUrl: 'https://carmayoutfit.com',
    screenshotsDir: '/tmp/screenshots', // Carpeta temporal en el contenedor
    viewports: {
        desktop: { width: 1920, height: 1080 },
        mobile: { width: 375, height: 812, isMobile: true, hasTouch: true }
    }
};

// Crear directorio de capturas si no existe en el contenedor
if (!fs.existsSync(CONFIG.screenshotsDir)) {
    fs.mkdirSync(CONFIG.screenshotsDir);
}

async function capturePage(page, filename, url) {
    console.log(`Navegando a: ${url}`);
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        
        // Esperar un poco para asegurar renderizado de animaciones y recursos dinámicos
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Captura Escritorio
        await page.setViewport(CONFIG.viewports.desktop);
        await page.screenshot({ path: path.join(CONFIG.screenshotsDir, `desktop_${filename}.png`), fullPage: true });
        console.log(`✓ Capturada vista escritorio para: ${filename}`);

        // Captura Móvil
        await page.setViewport(CONFIG.viewports.mobile);
        await page.screenshot({ path: path.join(CONFIG.screenshotsDir, `mobile_${filename}.png`), fullPage: true });
        console.log(`✓ Capturada vista móvil para: ${filename}`);
    } catch (e) {
        console.error(`✗ Error al capturar página ${filename}:`, e.message);
    }
}

async function run() {
    console.log("Iniciando navegador Puppeteer dentro del contenedor...");
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium', // Usar el binario de Chromium instalado en el contenedor
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();

    try {
        // 1. Capturar Inicio
        await capturePage(page, 'inicio', `${CONFIG.baseUrl}/`);

        // 2. Capturar Tienda
        await capturePage(page, 'tienda', `${CONFIG.baseUrl}/products/`);

        // 3. Capturar Contacto
        await capturePage(page, 'contacto', `${CONFIG.baseUrl}/contact/`);

        // 4. FLUJO INTERACTIVO: Añadir al carrito desde la página de un producto individual
        const productUrl = `${CONFIG.baseUrl}/product/chancleta-de-bano-ipanema/`;
        console.log(`Navegando a la página de producto: ${productUrl} para añadirlo al carrito...`);
        await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        
        // Esperar y buscar el botón de añadir al carrito de página individual
        const addToCartSelector = '.single_add_to_cart_button';
        await page.waitForSelector(addToCartSelector, { timeout: 15000 });
        await page.click(addToCartSelector);
        console.log("Producto añadido al carrito. Esperando actualización...");
        await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar procesamiento de WooCommerce

        // 5. Capturar Carrito con producto
        await capturePage(page, 'carrito_con_producto', `${CONFIG.baseUrl}/cart/`);

        // 6. Capturar Checkout con producto
        await capturePage(page, 'checkout_con_producto', `${CONFIG.baseUrl}/checkout/`);

        console.log("Auditoría visual automatizada completada. Capturas guardadas en /tmp/screenshots");
    } catch (error) {
        console.error("Error crítico durante la ejecución del script:", error);
    } finally {
        await browser.close();
    }
}

run();
