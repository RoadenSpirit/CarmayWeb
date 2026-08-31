/**
 * Fachada pública de la API de WooCommerce para CarmayWeb.
 *
 * Uso básico (en cualquier archivo de Astro):
 *
 *   import { woo } from '../api';
 *
 *   const bestSellers = await woo.products.getBestSellers(8);
 *   const ofertas     = await woo.products.getOnSale(8);
 *   const bajoStock   = await woo.products.getLowStock(6);
 *
 * También se puede crear una instancia con configuración propia:
 *
 *   import { createWooCommerce } from '../api';
 *   const client = createWooCommerce({ maxRequestsPerSecond: 2 });
 */

export { WooCommerceClient } from './client/WooCommerceClient.js';
export type { WooCommerceClientOptions, RequestOptions, WooQueryParams } from './client/WooCommerceClient.js';
export { RateLimiter } from './client/RateLimiter.js';

export { Product, LOW_STOCK_THRESHOLD } from './models/Product.js';
export type { ProductCardData, ProductData } from './models/Product.js';

export { Products } from './resources/Products.js';
export { Categories } from './resources/Categories.js';
export { Tags } from './resources/Tags.js';
export { Currency } from './resources/Currency.js';

export { wooConfig } from './config.js';
export * from './types/woocommerce.js';

import { WooCommerceClient, type WooCommerceClientOptions } from './client/WooCommerceClient.js';
import { Products } from './resources/Products.js';
import { Categories } from './resources/Categories.js';
import { Tags } from './resources/Tags.js';
import { Currency } from './resources/Currency.js';

/** Colección de recursos listos para consumir. */
export interface WooCommerce {
  client: WooCommerceClient;
  products: Products;
  categories: Categories;
  tags: Tags;
  currency: Currency;
}

/**
 * Construye una fachada completa (cliente + recursos) con la configuración dada.
 */
export function createWooCommerce(options: WooCommerceClientOptions = {}): WooCommerce {
  const client = new WooCommerceClient(options);
  return {
    client,
    products: new Products(client),
    categories: new Categories(client),
    tags: new Tags(client),
    currency: new Currency(client),
  };
}

/**
 * Instancia singleton con la configuración de las variables de entorno.
 */
export const woo: WooCommerce = createWooCommerce();