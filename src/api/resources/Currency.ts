import type { WooCommerceClient } from '../client/WooCommerceClient.js';
import { wooConfig } from '../config.js';

export class Currency {
  private cachedCupRate: number | null = null;

  constructor(private readonly client: WooCommerceClient) {}

  /**
   * Obtiene la tasa de cambio actual del CUP configurada en el plugin WOOCS de WordPress.
   * Si la consulta falla o no se obtiene respuesta, devuelve la tasa de respaldo `wooConfig.cupExchangeRate` (700 por defecto).
   */
  async getCupRate(): Promise<number> {
    if (this.cachedCupRate !== null) {
      return this.cachedCupRate;
    }

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
        this.cachedCupRate = parsedRate;
        return this.cachedCupRate;
      }
    } catch {
      // Fallback si la API de WOOCS no responde durante el build
    }

    this.cachedCupRate = wooConfig.cupExchangeRate;
    return this.cachedCupRate;
  }
}
