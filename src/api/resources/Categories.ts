import type { WooCommerceClient } from '../client/WooCommerceClient.js';
import type { WooCategoryResponse } from '../types/woocommerce.js';

/**
 * Recurso de categorías de producto.
 */
export class Categories {
  constructor(private readonly client: WooCommerceClient) {}

  /**
   * Recupera todas las categorías de producto.
   */
  async getAll(): Promise<WooCategoryResponse[]> {
    return this.client.getAll<WooCategoryResponse>('products/categories');
  }

  /**
   * Obtiene una categoría por ID.
   */
  async getById(id: number): Promise<WooCategoryResponse> {
    return this.client.get<WooCategoryResponse>(`products/categories/${id}`);
  }

  /**
   * Obtiene una categoría por nombre exacto. Devuelve null si no existe.
   */
  async getByName(name: string): Promise<WooCategoryResponse | null> {
    const all = await this.getAll();
    return all.find((category) => category.name.toLowerCase() === name.toLowerCase()) ?? null;
  }
}