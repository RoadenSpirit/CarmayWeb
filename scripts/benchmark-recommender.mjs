import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

// 1. Cargar productos reales de WooCommerce
const cacheDir = path.resolve('.wc-cache');
const files = fs.readdirSync(cacheDir);
const slugMap = new Map();

for (const f of files) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(cacheDir, f), 'utf8'));
    if (Array.isArray(data)) {
      for (const p of data) {
        if (p.slug && !slugMap.has(p.slug)) {
          slugMap.set(p.slug, p);
        }
      }
    }
  } catch (e) {}
}

const allProducts = Array.from(slugMap.values());
const techProducts = allProducts.filter(p => {
  const cat = p.categories?.[0]?.slug;
  return cat === 'tecnologia';
});

console.log('================================================================');
console.log('       BENCHMARK DE RENDIMIENTO: MOTOR DE RECOMENDACIONES       ');
console.log('================================================================');
console.log(`Total productos cargados: ${allProducts.length}`);
console.log(`Total productos en categoría "Tecnología": ${techProducts.length}\n`);

// 2. Definición del Motor Semántico Multicriterio Aislado
const STOPWORDS = new Set([
  'de', 'con', 'y', 'en', 'para', 'por', 'la', 'el', 'los', 'las', 'un', 'una', 
  'unos', 'unas', 'al', 'del', 'a', 'o', 'u', 'd', 'q', 'new', 'mas', 'sin'
]);

// Diccionario de afinidad semántica especializada para Tecnología en Cuba
const TECH_SYNONYMS = {
  inversor: ['panel', 'solar', 'bateria', 'hibrido', 'vevor', 'sumry', 'cable', 'ecoflow', 'regulador'],
  solar: ['panel', 'inversor', 'lampara', 'bateria', 'cable', 'ecoflow'],
  panel: ['solar', 'inversor', 'estructura', 'cable', 'base', 'bateria'],
  bateria: ['inversor', 'solar', 'recargable', 'power', 'bank', 'ecoflow'],
  ventilador: ['recargable', 'portatil', 'torre', 'pared', 'mesa'],
  camara: ['timbre', 'seguridad', 'wifi', 'hisseu', 'vision', 'puerta'],
  timbre: ['camara', 'seguridad', 'wifi', 'puerta'],
  audifono: ['inalambrico', 'bluetooth', 'speaker', 'altavoz', 'ear'],
  speaker: ['audifono', 'altavoz', 'bluetooth', 'sonido']
};

function getStemmedTokens(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w))
    .map(w => {
      // Regla de lematización en español
      if (w.endsWith('es') && w.length > 4) return w.slice(0, -2);
      if (w.endsWith('s') && !w.endsWith('is') && w.length > 3) return w.slice(0, -1);
      return w;
    });
}

function calculateRecommendationScore(target, candidate) {
  const targetTokens = getStemmedTokens(target.name);
  const targetTokenSet = new Set(targetTokens);
  const candTokens = getStemmedTokens(candidate.name);

  let exactMatches = 0;
  let synonymMatches = 0;

  for (const t of candTokens) {
    if (targetTokenSet.has(t)) {
      exactMatches++;
    } else {
      // Evaluar sinónimos y complementariedad tecnológica
      for (const targetToken of targetTokens) {
        const synList = TECH_SYNONYMS[targetToken];
        if (synList && synList.includes(t)) {
          synonymMatches++;
          break;
        }
      }
    }
  }

  // 1. Puntos semánticos: coincidencia exacta tiene peso supremo (40 pts base + 25 por token extra)
  let semanticScore = 0;
  if (exactMatches > 0) {
    semanticScore += 40 + (exactMatches * 25);
  }
  // Coincidencia complementaria (ej: panel para inversor, timbre para cámara)
  if (synonymMatches > 0) {
    semanticScore += 25 + (synonymMatches * 15);
  }

  // 2. Proximidad de Precio (0 a 20 pts)
  const priceA = parseFloat(target.price || target.regular_price || 1);
  const priceB = parseFloat(candidate.price || candidate.regular_price || 1);
  const ratio = Math.min(priceA, priceB) / Math.max(priceA, priceB);
  const priceScore = ratio * 20;

  // 3. Demanda y Popularidad (0 a 15 pts)
  const salesScore = Math.min(10, (candidate.total_sales || 0) * 3);
  const saleBonus = candidate.on_sale ? 5 : 0;

  // 4. Desempate determinista único por producto (0 a 3 pts)
  const combined = (target.slug || '') + (candidate.slug || '');
  let hash = 0;
  for (let i = 0; i < combined.length; i++) hash = (hash + combined.charCodeAt(i)) % 100;
  const tieBreaker = (hash / 100) * 3;

  return semanticScore + priceScore + salesScore + saleBonus + tieBreaker;
}

export function recommendForProduct(target, pool, limit = 4) {
  const targetCat = target.categories?.[0]?.slug;

  // Filtrar estrictamente la misma categoría y excluirse a sí mismo
  const candidates = pool.filter(p => 
    p.slug !== target.slug &&
    p.categories?.[0]?.slug === targetCat &&
    p.images && p.images.length > 0
  );

  const scored = [];
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const score = calculateRecommendationScore(target, c);
    scored.push({ product: c, score });
  }

  // Ordenar de mayor a menor afinidad
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

// 3. Ejecutar Pruebas de Estrés y Medición de Tiempo
const testTargets = [
  'sumry-inversor-hibrido-3600w',
  'ventilador-portatil-recargable-nar',
  'timbre-negro-y-gris-con-camara-1080p',
  'cable-conector-xt60i',
  'power-bank-30-000mah'
];

for (const targetSlug of testTargets) {
  const target = techProducts.find(p => p.slug === targetSlug) || techProducts[0];
  if (!target) continue;

  const t0 = performance.now();
  const recommendations = recommendForProduct(target, techProducts, 4);
  const t1 = performance.now();
  const elapsedMs = (t1 - t0).toFixed(3);

  console.log(`----------------------------------------------------------------`);
  console.log(`OBJETIVO: "${target.name}"`);
  console.log(`Precio: $${target.price} USD | Slug: ${target.slug}`);
  console.log(`TIEMPO DE CÁLCULO: ${elapsedMs} ms (${(elapsedMs * 1000).toFixed(0)} microsegundos)`);
  console.log(`RECOMENDACIONES OBTENIDAS:`);
  
  recommendations.forEach((r, idx) => {
    console.log(`  ${idx + 1}. "${r.product.name}" ($${r.product.price} USD) -> Score: ${r.score.toFixed(1)}`);
  });
  console.log('');
}

// 4. Test de Rendimiento Masivo: Recomendar para TODA la categoría de Tecnología
console.log('================================================================');
console.log('BENCHMARK MASIVO: Generar recomendaciones para TODA la tienda...');
console.log('================================================================');

const batchT0 = performance.now();
let totalOps = 0;

for (const prod of techProducts) {
  recommendForProduct(prod, techProducts, 4);
  totalOps++;
}

const batchT1 = performance.now();
const totalBatchMs = (batchT1 - batchT0).toFixed(2);
const avgMsPerProduct = (totalBatchMs / totalOps).toFixed(4);

console.log(`Productos de Tecnología procesados: ${totalOps}`);
console.log(`Tiempo TOTAL para toda la categoría: ${totalBatchMs} ms`);
console.log(`Tiempo PROMEDIO por producto: ${avgMsPerProduct} ms`);
console.log(`Operaciones por segundo: ${Math.round(1000 / avgMsPerProduct)} productos/segundo`);
console.log('================================================================\n');
