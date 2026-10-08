import type { WooCommerceClient } from '../client/WooCommerceClient.js';
import { wooConfig } from '../config.js';
import type { WooProduct } from '../types/woocommerce.js';

export class Currency {
  private cachedCupRate: number | null = null;

  constructor(private readonly client: WooCommerceClient) {}

  /**
   * Obtiene la tasa de cambio actual del CUP de forma 100% autónoma:
   * 1. Si existe una variable de entorno inyectada durante el build (ej. desde n8n), la respeta.
   * 2. Intenta consultar el plugin WOOCS en WordPress (../woocs/v3/currency).
   * 3. Si no, analiza los primeros productos de WooCommerce para calcular la relación
   *    real entre su precio en USD y su precio CUP (_precio_cup o en la descripción).
   * 4. Si todo falla, usa el fallback seguro de wooConfig.cupExchangeRate.
   */
  async getCupRate(): Promise<number> {
    if (this.cachedCupRate !== null) {
      return this.cachedCupRate;
    }

    // 1. Verificar si se inyectó explícitamente en el entorno de ejecución
    const envRate = Number.parseInt(process.env.WC_CUP_EXCHANGE_RATE ?? '', 10);
    if (Number.isFinite(envRate) && envRate > 0) {
      console.log(`[Currency] Tasa CUP provista por variable de entorno: ${envRate} CUP/USD`);
      this.cachedCupRate = envRate;
      return this.cachedCupRate;
    }

    // 2. Intentar consultar WOOCS API en WordPress
    try {
      const rates = await this.client.get<Record<string, { rate: string | number }>>(
        '../woocs/v3/currency',
        {},
        { cacheTtlMs: 3600000 },
      );

      const rawCupRate = rates?.CUP?.rate;
      const parsedRate =
        typeof rawCupRate === 'number' ? rawCupRate : Number.parseFloat(String(rawCupRate ?? ''));

      if (Number.isFinite(parsedRate) && parsedRate > 0) {
        console.log(`[Currency] Tasa CUP obtenida desde WOOCS: ${parsedRate} CUP/USD`);
        this.cachedCupRate = parsedRate;
        return this.cachedCupRate;
      }
    } catch {
      // Continuar al siguiente método si WOOCS no está activo
    }

    // 3. Inspeccionar primeros productos de WooCommerce para deducir la tasa real
    try {
      const sampleProducts = await this.client.get<WooProduct[]>('products', {
        per_page: 5,
        status: 'publish',
      });

      if (Array.isArray(sampleProducts) && sampleProducts.length > 0) {
        for (const prod of sampleProducts) {
          const priceUSD = Number.parseFloat(prod.price || prod.regular_price || '0');
          if (!priceUSD || priceUSD <= 0) continue;

          // Buscar en meta_data _precio_cup
          const cupMeta = prod.meta_data?.find(
            (m) => m.key === '_precio_cup' || m.key.toLowerCase().includes('precio_cup'),
          );
          let cupPrice = cupMeta ? Number.parseFloat(String(cupMeta.value)) : 0;

          // Si no está en meta_data, buscar en la descripción ("Precio CUP: 2954")
          if (!cupPrice || cupPrice <= 0) {
            const descMatch = (prod.description || '').match(/precio\s*cup\s*:\s*([\d\.,]+)/i);
            if (descMatch && descMatch[1]) {
              cupPrice = Number.parseFloat(descMatch[1].replace(/,/g, ''));
            }
          }

          if (cupPrice && cupPrice > 0) {
            const inferredRate = Math.round(cupPrice / priceUSD);
            if (inferredRate >= 50 && inferredRate <= 5000) {
              console.log(
                `[Currency] Tasa CUP auto-detectada desde producto "${prod.name}": ${inferredRate} CUP/USD ($${priceUSD} USD = ${cupPrice} CUP)`,
              );
              this.cachedCupRate = inferredRate;
              return this.cachedCupRate;
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Currency] No se pudo auto-detectar tasa desde productos de WooCommerce:', err);
    }

    // 4. Fallback configurado
    console.log(`[Currency] Usando tasa CUP por defecto: ${wooConfig.cupExchangeRate} CUP/USD`);
    this.cachedCupRate = wooConfig.cupExchangeRate;
    return this.cachedCupRate;
  }
}
