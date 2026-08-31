import type { WooCommerceClient } from '../client/WooCommerceClient.js';
import type { WooTagResponse } from '../types/woocommerce.js';

/**
 * Recurso de etiquetas de producto (usadas para ofertas, destacados, etc.).
 */
export class Tags {
  constructor(private readonly client: WooCommerceClient) {}

  /**
   * Recupera todas las etiquetas de producto.
   */
  async getAll(): Promise<WooTagResponse[]> {
    return this.client.getAll<WooTagResponse>('products/tags');
  }

  /**
   * Obtiene una etiqueta por ID.
   */
  async getById(id: number): Promise<WooTagResponse> {
    return this.client.get<WooTagResponse>(`products/tags/${id}`);
  }

  /**
   * Obtiene una etiqueta por nombre exacto. Devuelve null si no existe.
   */
  async getByName(name: string): Promise<WooTagResponse | null> {
    const all = await this.getAll();
    return all.find((tag) => tag.name.toLowerCase() === name.toLowerCase()) ?? null;
  }
}