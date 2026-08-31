import type { WooCommerceClient } from '../client/WooCommerceClient.js';
import { Product } from '../models/Product.js';
import { Currency } from './Currency.js';
import type { WooProduct, WooProductQuery } from '../types/woocommerce.js';

/**
 * Recurso de productos. Agrupa todas las consultas que la web necesita:
 * catálogo, más vendidos, ofertas, bajo stock, por categoría/etiqueta y búsqueda.
 */
export class Products {
  private readonly currency: Currency;

  constructor(private readonly client: WooCommerceClient) {
    this.currency = new Currency(client);
  }

  /**
   * Recupera todos los productos recorriendo la paginación completa.
   */
  async getAll(params: WooProductQuery = {}): Promise<Product[]> {
    const cupRate = await this.currency.getCupRate();
    const raw = await this.client.getAll<WooProduct>('products', params as Record<string, string | number | boolean | undefined>);
    return Product.fromArray(raw, cupRate);
  }

  /**
   * Recupera una sola página de productos (útil para secciones acotadas).
   */
  async list(params: WooProductQuery = {}): Promise<Product[]> {
    const cupRate = await this.currency.getCupRate();
    const raw = await this.client.get<WooProduct[]>('products', {
      ...params,
      per_page: params.per_page ?? this.client.perPage,
    } as Record<string, string | number | boolean | undefined>);
    return Product.fromArray(raw, cupRate);
  }

  /**
   * Obtiene un producto por su ID.
   */
  async getById(id: number): Promise<Product> {
    const cupRate = await this.currency.getCupRate();
    const raw = await this.client.get<WooProduct>(`products/${id}`);
    return new Product(raw, cupRate);
  }

  /**
   * Obtiene un producto por su slug. Devuelve null si no existe.
   */
  async getBySlug(slug: string): Promise<Product | null> {
    const cupRate = await this.currency.getCupRate();
    const [raw] = await this.client.get<WooProduct[]>('products', { slug });
    return raw ? new Product(raw, cupRate) : null;
  }

  /**
   * Obtiene un producto por su SKU. Devuelve null si no existe.
   */
  async getBySku(sku: string): Promise<Product | null> {
    const cupRate = await this.currency.getCupRate();
    const [raw] = await this.client.get<WooProduct[]>('products', { sku });
    return raw ? new Product(raw, cupRate) : null;
  }

  /**
   * Productos más vendidos (ordenados por `total_sales` descendente).
   */
  async getBestSellers(limit = 8): Promise<Product[]> {
    const products = await this.list({
      orderby: 'popularity',
      order: 'desc',
      per_page: Math.min(limit, 100),
    });
    return products.slice(0, limit);
  }

  /**
   * Productos en oferta (`on_sale=true`).
   */
  async getOnSale(limit = 8): Promise<Product[]> {
    const products = await this.list({
      on_sale: true,
      per_page: Math.min(limit, 100),
    });
    return products.slice(0, limit);
  }

  /**
   * Productos con bajo stock (en stock y con `stock_quantity <= maxQuantity`).
   * Nota: WooCommerce no expone filtro nativo, se filtra sobre el catálogo.
   */
  async getLowStock(limit = 8, maxQuantity = 5): Promise<Product[]> {
    const all = await this.getAll();
    return all
      .filter((product) => product.isLowStock && (product.stockQuantity ?? Infinity) <= maxQuantity)
      .slice(0, limit);
  }

  /**
   * Productos de una categoría determinada.
   */
  async getByCategory(categoryId: number, limit = 100): Promise<Product[]> {
    const products = await this.list({
      category: categoryId,
      per_page: Math.min(limit, 100),
    });
    return products.slice(0, limit);
  }

  /**
   * Productos con una etiqueta determinada.
   */
  async getByTag(tagId: number, limit = 100): Promise<Product[]> {
    const products = await this.list({
      tag: tagId,
      per_page: Math.min(limit, 100),
    });
    return products.slice(0, limit);
  }

  /**
   * Búsqueda por texto libre (nombre, SKU, etc.).
   */
  async search(term: string, limit = 20): Promise<Product[]> {
    const products = await this.list({
      search: term,
      per_page: Math.min(limit, 100),
    });
    return products.slice(0, limit);
  }
}