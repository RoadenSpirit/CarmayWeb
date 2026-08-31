/**
 * Prueba de integración del sistema de API de WooCommerce.
 *
 * Uso:
 *   npx tsx scripts/test-api.ts
 *
 * Nota: se pasan credenciales explícitas para poder ejecutarse con Node puro
 * (fuera de Astro). La app real lee las variables de entorno de `.env`.
 */
import { createWooCommerce } from '../src/api/index.js';

async function main(): Promise<void> {
  const woo = createWooCommerce({
    consumerKey: 'dc552e8b274bfe095f088b6224686f27e05b250c20a9e72a5c3adfbfca975c7a',
    consumerSecret: '77f3773550114a07636fbebb8a897f82600cb42a',
    maxRequestsPerSecond: 4,
    cacheEnabled: false,
  });

  console.log('=== TOTAL PRODUCTOS ===');
  const all = await woo.products.getAll();
  console.log(`Catálogo completo: ${all.length} productos`);
  if (all[0]) console.log('Ejemplo (card):', JSON.stringify(all[0].toCard(), null, 2));

  console.log('\n=== MÁS VENDIDOS (orderby=popularity) ===');
  const best = await woo.products.getBestSellers(5);
  best.forEach((p) => console.log(` - ${p.name} | ventas=${p.totalSales} | ${p.priceFormatted}`));

  console.log('\n=== EN OFERTA (on_sale=true) ===');
  const onSale = await woo.products.getOnSale(10);
  onSale.forEach((p) => console.log(` - ${p.name} | ${p.priceFormatted} (${p.discountPercent}% dto)`));

  console.log('\n=== BAJO STOCK (stock <= 5) ===');
  const low = await woo.products.getLowStock(10);
  low.forEach((p) => console.log(` - ${p.name} | stock=${p.stockQuantity} | ${p.stockStatus}`));

  console.log('\n=== CATEGORÍAS ===');
  const cats = await woo.categories.getAll();
  cats.forEach((c) => console.log(` - ${c.name} (id=${c.id}, productos=${c.count})`));

  console.log('\n=== ETIQUETAS ===');
  const tags = await woo.tags.getAll();
  tags.forEach((t) => console.log(` - ${t.name} (id=${t.id}, productos=${t.count})`));

  console.log('\n=== BÚSQUEDA ===');
  const found = await woo.products.search('VESTIDOS');
  found.forEach((p) => console.log(` - ${p.name} | ${p.sku}`));
}

main().catch((err) => {
  console.error('Error en la prueba:', err);
  process.exit(1);
});