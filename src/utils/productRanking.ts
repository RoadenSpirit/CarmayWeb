import type { Product } from '../api/models/Product.js';

/**
 * Calcula el puntaje de relevancia y prioridad comercial de un producto en tiempo de compilación.
 * Combina demanda (ventas), ofertas (descuentos activos), escasez (bajo stock pero disponible)
 * y destacados/tendencias.
 */
export function calculateProductCuratedScore(product: Product): number {
  // Regla estricta: Agotados siempre al final con penalización severa
  if (!product.isInStock) {
    return -1000;
  }

  let score = 0;

  // 1. Alta Demanda (Historial de Ventas)
  // Cada venta suma 4 puntos hasta un tope de 40 puntos
  if (product.totalSales > 0) {
    score += Math.min(40, product.totalSales * 4);
  }

  // 2. Oferta / Rebaja
  // Si está en rebaja, suma 30 puntos base + hasta 20 puntos por magnitud del descuento
  if (product.isOnSale) {
    score += 30;
    score += Math.min(20, Math.round(product.discountPercent * 0.5));
  }

  // 3. Escasez / Bajo Stock (Urgencia de compra)
  if (product.stockQuantity !== null && product.stockQuantity > 0) {
    if (product.stockQuantity === 1) {
      score += 25; // ¡Solo queda 1!
    } else if (product.stockQuantity <= 3) {
      score += 18; // 2 o 3 unidades
    } else if (product.stockQuantity <= 5) {
      score += 10; // Hasta 5 unidades
    }
  }

  // 4. Tendencias / Destacado
  if (product.isTrending) {
    score += 15;
  }
  if (product.featured) {
    score += 10;
  }

  return score;
}

/**
 * Ordena una lista de productos aplicando el algoritmo multicriterio precalculado.
 */
export function sortProductsByCuratedScore(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    // 1. En stock primero
    if (a.isInStock !== b.isInStock) {
      return a.isInStock ? -1 : 1;
    }

    // 2. Puntaje multicriterio descendente
    const scoreA = calculateProductCuratedScore(a);
    const scoreB = calculateProductCuratedScore(b);
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }

    // 3. Desempate por mayor cantidad de ventas
    if (a.totalSales !== b.totalSales) {
      return b.totalSales - a.totalSales;
    }

    // 4. Desempate por menor precio
    return a.price - b.price;
  });
}
