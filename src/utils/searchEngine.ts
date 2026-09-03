/**
 * Motor de Búsqueda Inteligente Client-Side para CarmayWeb.
 * Implementa:
 * 1. Normalización NFD (sin tildes ni diacríticos).
 * 2. Lematización / Stemming en español (singularización y eliminación de sufijos).
 * 3. N-Gramos (Trigramas) de caracteres.
 * 4. Similitud Coseno con tolerancia a faltas de ortografía (Fuzzy Matching).
 * 5. Puntuación ponderada por relevancia (Título > Categoría > Tags).
 */

export interface SearchableProduct {
  id: number;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  primaryImage: string;
  priceUSD: number;
  priceCUP: number;
  regularPriceUSD?: number;
  regularPriceCUP?: number;
  isOnSale: boolean;
  stockQuantity: number | null;
  isInStock: boolean;
  isTrending?: boolean;
  tags?: string[];
}

export interface SearchResultItem extends SearchableProduct {
  score: number;
}

/**
 * Normaliza un texto: elimina tildes, caracteres especiales y convierte a minúsculas.
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Lematización simplificada en español: reduce plurales y terminaciones a su raíz.
 */
export function stemSpanish(word: string): string {
  let w = normalizeText(word);
  if (w.length <= 3) return w;

  // Eliminar sufijos de plurales
  if (w.endsWith('es') && w.length > 4) {
    w = w.slice(0, -2);
  } else if (w.endsWith('s') && !w.endsWith('is') && w.length > 3) {
    w = w.slice(0, -1);
  }

  // Diminutivos / Aumentativos comunes
  if (w.endsWith('itos') || w.endsWith('itas')) {
    w = w.slice(0, -4);
  } else if (w.endsWith('ito') || w.endsWith('ita')) {
    w = w.slice(0, -3);
  }

  return w;
}

/**
 * Genera la lista de trigramas (secuencias de 3 caracteres) de una palabra.
 */
export function getTrigrams(word: string): string[] {
  const clean = `^${normalizeText(word)}$`;
  if (clean.length < 3) return [clean];

  const trigrams: string[] = [];
  for (let i = 0; i < clean.length - 2; i++) {
    trigrams.push(clean.slice(i, i + 3));
  }
  return trigrams;
}

/**
 * Calcula la Similitud Coseno basada en la intersección de trigramas (0.0 a 1.0).
 */
export function cosineSimilarityTrigrams(trigramsA: string[], trigramsB: string[]): number {
  if (trigramsA.length === 0 || trigramsB.length === 0) return 0;

  const setB = new Set(trigramsB);
  let intersectionCount = 0;

  for (const tri of trigramsA) {
    if (setB.has(tri)) {
      intersectionCount++;
    }
  }

  const denominator = Math.sqrt(trigramsA.length * trigramsB.length);
  return denominator === 0 ? 0 : intersectionCount / denominator;
}

/**
 * Clase principal del Motor de Búsqueda.
 */
export class SearchEngine {
  private products: SearchableProduct[] = [];
  private indexedData: Array<{
    product: SearchableProduct;
    nameClean: string;
    nameStems: string[];
    nameTrigrams: string[];
    categoryClean: string;
    tagsClean: string[];
  }> = [];

  constructor(products: SearchableProduct[]) {
    this.products = products;
    this.buildIndex();
  }

  /**
   * Pre-construye el índice en memoria para consultas ultrarrápidas (< 5ms).
   */
  private buildIndex(): void {
    this.indexedData = this.products.map((product) => {
      const nameClean = normalizeText(product.name);
      const nameWords = nameClean.split(' ').filter(Boolean);
      const nameStems = nameWords.map(stemSpanish);
      const nameTrigrams = getTrigrams(nameClean);
      const categoryClean = normalizeText(product.category);
      const tagsClean = (product.tags || []).map(normalizeText);

      return {
        product,
        nameClean,
        nameStems,
        nameTrigrams,
        categoryClean,
        tagsClean,
      };
    });
  }

  /**
   * Ejecuta la búsqueda sobre el catálogo con tolerancia a errores tipográficos.
   */
  search(query: string, threshold = 0.35): SearchResultItem[] {
    const cleanQuery = normalizeText(query);
    if (!cleanQuery || cleanQuery.length < 2) return [];

    const queryTokens = cleanQuery.split(' ').filter(Boolean);
    const queryStems = queryTokens.map(stemSpanish);
    const queryTrigrams = getTrigrams(cleanQuery);

    const results: SearchResultItem[] = [];

    for (const item of this.indexedData) {
      let score = 0;
      let matchesAllTokens = true;

      for (let idx = 0; idx < queryTokens.length; idx++) {
        const qToken = queryTokens[idx];
        const qStem = queryStems[idx];
        const tokenTrigrams = getTrigrams(qToken);

        let tokenMatchScore = 0;

        // 1. Coincidencia exacta o por raíz en el título (máxima puntuación)
        if (item.nameClean.includes(qToken) || item.nameStems.includes(qStem)) {
          tokenMatchScore += 100;
          if (item.nameClean.startsWith(qToken)) {
            tokenMatchScore += 50; // Bonus por iniciar con la palabra
          }
        }

        // 2. Coincidencia en categoría
        if (item.categoryClean.includes(qToken) || item.categoryClean.includes(qStem)) {
          tokenMatchScore += 40;
        }

        // 3. Coincidencia en etiquetas
        if (item.tagsClean.some((tag) => tag.includes(qToken) || tag.includes(qStem))) {
          tokenMatchScore += 30;
        }

        // 4. Fuzzy Matching por Similitud Coseno de Trigramas (para errores tipográficos como "vetsido")
        if (tokenMatchScore === 0) {
          const sim = cosineSimilarityTrigrams(tokenTrigrams, item.nameTrigrams);
          if (sim >= threshold) {
            tokenMatchScore += Math.round(sim * 80); // Hasta 80 pts de similitud matemática
          }
        }

        // Si este token no tuvo coincidencia en ningún nivel, no cumple el filtro AND
        if (tokenMatchScore === 0) {
          matchesAllTokens = false;
          break;
        }

        score += tokenMatchScore;
      }

      // Evaluar también similitud global de la frase si no hubo coincidencia estricta por token
      if (!matchesAllTokens && queryTokens.length > 1) {
        const fullSim = cosineSimilarityTrigrams(queryTrigrams, item.nameTrigrams);
        if (fullSim >= 0.45) {
          matchesAllTokens = true;
          score = Math.round(fullSim * 120);
        }
      }

      if (matchesAllTokens && score > 0) {
        results.push({
          ...item.product,
          score,
        });
      }
    }

    // Ordenar por puntuación descendente, poniendo productos en stock primero
    results.sort((a, b) => {
      if (a.isInStock !== b.isInStock) {
        return a.isInStock ? -1 : 1;
      }
      return b.score - a.score;
    });

    return results;
  }
}
