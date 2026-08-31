/**
 * Tipos de la API REST de WooCommerce (v3).
 * Solo se modelan las entidades y campos que CarmayWeb consume.
 */

export type WooOrderBy =
  | 'date'
  | 'id'
  | 'include'
  | 'title'
  | 'slug'
  | 'price'
  | 'popularity'
  | 'rating';

export type WooOrder = 'asc' | 'desc';

export type WooStockStatus = 'instock' | 'outofstock' | 'onbackorder';

// ------------------------------------------------------------
// Imágenes, categorías y etiquetas
// ------------------------------------------------------------

export interface WooImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

export interface WooCategory {
  id: number;
  name: string;
  slug: string;
}

export interface WooTag {
  id: number;
  name: string;
  slug: string;
}

// ------------------------------------------------------------
// Producto (respuesta completa de /products)
// ------------------------------------------------------------

export interface WooProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  type: string;
  status: string;
  featured: boolean;
  catalog_visibility: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  date_on_sale_from: string | null;
  date_on_sale_from_gmt: string | null;
  date_on_sale_to: string | null;
  date_on_sale_to_gmt: string | null;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: WooStockStatus;
  average_rating: string;
  rating_count: number;
  categories: WooCategory[];
  tags: WooTag[];
  images: WooImage[];
}

// ------------------------------------------------------------
// Parámetros de consulta de /products
// ------------------------------------------------------------

export interface WooProductQuery {
  search?: string;
  slug?: string;
  sku?: string;
  category?: number;
  tag?: number;
  on_sale?: boolean;
  featured?: boolean;
  stock_status?: WooStockStatus;
  orderby?: WooOrderBy;
  order?: WooOrder;
  per_page?: number;
  page?: number;
  include?: number | number[];
  exclude?: number | number[];
}

// ------------------------------------------------------------
// Categorías y etiquetas (respuestas de sus endpoints)
// ------------------------------------------------------------

export interface WooCategoryResponse {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  display: string;
  image: WooImage | null;
  menu_order: number;
  count: number;
}

export interface WooTagResponse {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
}