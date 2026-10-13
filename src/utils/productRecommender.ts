import type { Product, ProductCardData } from '../api/models/Product.js';

/**
 * Palabras vacías en español a descartar para extraer la intención semántica pura.
 */
const STOPWORDS = new Set([
  'de', 'con', 'y', 'en', 'para', 'por', 'la', 'el', 'los', 'las', 'un', 'una',
  'unos', 'unas', 'al', 'del', 'a', 'o', 'u', 'd', 'q', 'new', 'mas', 'sin',
  'muy', 'tan', 'sus', 'sus', 'sobre', 'entre', 'tras', 'hacia', 'hasta', 'desde'
]);

/**
 * Familias de complementariedad y afinidad semántica especializada para el catálogo de Carmay.
 */
const CATEGORY_AFFINITY_MAP: Record<string, string[]> = {
  // Tecnología
  inversor: ['panel', 'solar', 'bateria', 'hibrido', 'vevor', 'sumry', 'cable', 'ecoflow', 'regulador'],
  solar: ['panel', 'inversor', 'lampara', 'bateria', 'cable', 'ecoflow', 'estructura'],
  panel: ['solar', 'inversor', 'estructura', 'cable', 'base', 'bateria'],
  bateria: ['inversor', 'solar', 'recargable', 'power', 'bank', 'ecoflow'],
  ventilador: ['recargable', 'portatil', 'torre', 'pared', 'mesa'],
  camara: ['timbre', 'seguridad', 'wifi', 'hisseu', 'vision', 'puerta'],
  timbre: ['camara', 'seguridad', 'wifi', 'puerta'],
  audifono: ['inalambrico', 'bluetooth', 'speaker', 'altavoz', 'ear'],
  speaker: ['audifono', 'altavoz', 'bluetooth', 'sonido'],

  // Calzado
  sandalia: ['cocaleca', 'chancleta', 'playa', 'verano', 'plana', 'tira'],
  chancleta: ['sandalia', 'bano', 'playa', 'alta', 'ipanema', 'sport'],
  zapato: ['punta', 'fina', 'vestir', 'elegante', 'tacon', 'valerina'],
  valerina: ['zapato', 'plana', 'comoda', 'vestir'],
  pantunfla: ['chancleta', 'comoda', 'casa', 'dormir'],

  // Ropa
  vestido: ['elegante', 'verano', 'largo', 'corto', 'estampado', 'fiesta', 'encaje'],
  pantalon: ['mezclilla', 'jeans', 'casual', 'bloque', 'jogger'],
  short: ['shorpeta', 'bermuda', 'mezclilla', 'casual', 'playa'],
  pulover: ['camiseta', 'blusa', 'casual', 'top', 'manga'],
  blusa: ['pulover', 'camisa', 'top', 'cuello'],
  conjunto: ['falda', 'short', 'top', 'traje']
};

/**
 * Normaliza y lematiza las palabras de un título a su raíz en español.
 */
export function getStemmedTokens(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .map((w) => {
      // Regla de lematización morfológica en español
      if (w.endsWith('es') && w.length > 4) return w.slice(0, -2);
      if (w.endsWith('s') && !w.endsWith('is') && w.length > 3) return w.slice(0, -1);
      return w;
    });
}

/**
 * Calcula el puntaje de afinidad multicriterio entre un producto objetivo y un candidato.
 */
export function calculateProductAffinityScore(target: Product, candidate: Product): number {
  const targetTokens = getStemmedTokens(target.name);
  const targetTokenSet = new Set(targetTokens);
  const candTokens = getStemmedTokens(candidate.name);

  let exactMatches = 0;
  let affinityMatches = 0;

  for (const t of candTokens) {
    if (targetTokenSet.has(t)) {
      exactMatches++;
    } else {
      // Evaluar sinónimos y familias complementarias
      for (const targetToken of targetTokens) {
        const affList = CATEGORY_AFFINITY_MAP[targetToken];
        if (affList && affList.includes(t)) {
          affinityMatches++;
          break;
        }
      }
    }
  }

  // 1. Scoring Semántico
  // Coincidencia léxica exacta (40 pts base + 25 por cada token coincidente adicional)
  let semanticScore = 0;
  if (exactMatches > 0) {
    semanticScore += 40 + exactMatches * 25;
  }
  // Coincidencia temática complementaria (25 pts base + 15 por token adicional)
  if (affinityMatches > 0) {
    semanticScore += 25 + affinityMatches * 15;
  }

  // 2. Coherencia de Rango de Precio (0 a 20 pts)
  const priceA = target.price > 0 ? target.price : 1;
  const priceB = candidate.price > 0 ? candidate.price : 1;
  const priceRatio = Math.min(priceA, priceB) / Math.max(priceA, priceB);
  const priceScore = priceRatio * 20;

  // 3. Demanda Comercial y Urgencia (0 a 15 pts)
  const salesScore = Math.min(10, (candidate.totalSales || 0) * 2.5);
  const onSaleBonus = candidate.isOnSale ? 5 : 0;
  const trendingBonus = candidate.isTrending ? 3 : 0;

  // 4. Diversidad y Desempate Determinista por Slug (0 a 3 pts)
  const combined = (target.slug || '') + (candidate.slug || '');
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash + combined.charCodeAt(i)) % 100;
  }
  const tieBreaker = (hash / 100) * 3;

  return semanticScore + priceScore + salesScore + onSaleBonus + trendingBonus + tieBreaker;
}

/**
 * Obtiene los mejores productos recomendados para un producto específico:
 * - Regla inmutable: estrictamente la misma categoría oficial.
 * - Excluye el propio producto y agotados/huérfanos.
 * - Deduplicado estrictamente por slug.
 */
export function getRecommendedProducts(
  target: Product,
  catalogPool: Product[],
  limit = 4,
): ProductCardData[] {
  const targetCategorySlug = target.categorySlug;
  if (!targetCategorySlug) return [];

  // Filtrar candidatos elegibles de la misma categoría
  const eligibleCandidates = catalogPool.filter(
    (c) =>
      c.slug !== target.slug &&
      c.categorySlug === targetCategorySlug &&
      c.hasRealImage &&
      c.hasValidCategory &&
      c.isInStock,
  );

  // Calcular afinidad
  const scoredCandidates = eligibleCandidates.map((c) => ({
    product: c,
    score: calculateProductAffinityScore(target, c),
  }));

  // Ordenar descendente por score
  scoredCandidates.sort((a, b) => b.score - a.score);

  // Deduplicar y convertir a ProductCardData
  const seenSlugs = new Set<string>();
  const results: ProductCardData[] = [];

  for (const item of scoredCandidates) {
    if (!seenSlugs.has(item.product.slug)) {
      seenSlugs.add(item.product.slug);
      results.push(item.product.toCard());
      if (results.length >= limit) break;
    }
  }

  return results;
}
