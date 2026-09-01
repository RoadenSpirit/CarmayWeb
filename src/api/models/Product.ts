import type { WooCategory, WooImage, WooProduct, WooStockStatus, WooTag } from '../types/woocommerce.js';

/** Umbral de stock para considerar un producto como "bajo stock". */
export const LOW_STOCK_THRESHOLD = 5;

/** Slugs (y nombre) de la etiqueta usada para marcar productos "en tendencia". */
export const TRENDING_TAG_SLUGS = ['tendencias', 'trending']; // el slug real generado por WooCommerce es 'trending'
export const TRENDING_TAG_NAME = 'Tendencias';

/**
 * Parsea un valor numérico de WooCommerce tolerando cadenas vacías o inválidas.
 * WooCommerce devuelve `price: ""` cuando no hay precio; `parseFloat('')` es
 * `NaN`, así que nunca usar `?? '0'` con estos campos (no atrapa '').
 */
function toFloat(value: string | number | null | undefined, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : fallback;
}

/** Forma de datos compatible con `ProductCard.astro`. */
export interface ProductCardData {
  title: string;
  price: string;
  regularPrice?: string;
  priceUSD: number;
  priceCUP: number;
  cupRate: number;
  regularPriceUSD?: number;
  regularPriceCUP?: number;
  image: string;
  category: string;
  isTrending?: boolean;
  permalink: string;
}

/** Representación plana y tipada de un producto para la web. */
export interface ProductData {
  id: number;
  name: string;
  slug: string;
  sku: string;
  permalink: string;
  description: string;
  shortDescription: string;
  price: number;
  priceCUP: number;
  cupRate: number;
  priceFormatted: string;
  regularPrice: number;
  regularPriceCUP: number;
  regularPriceFormatted: string;
  salePrice: number | null;
  salePriceCUP: number | null;
  salePriceFormatted: string | null;
  isOnSale: boolean;
  discountPercent: number;
  stockQuantity: number | null;
  stockStatus: WooStockStatus;
  isInStock: boolean;
  isLowStock: boolean;
  totalSales: number;
  rating: number;
  ratingCount: number;
  featured: boolean;
  primaryImage: string;
  images: string[];
  categories: WooCategory[];
  tags: WooTag[];
}

/**
 * Modelo de dominio: envuelve la respuesta cruda de WooCommerce y expone
 * los datos ya normalizados y formateados para la web (precios en USD,
 * porcentaje de descuento, estado de stock, etc.).
 */
export class Product {
  private readonly raw: WooProduct;
  public readonly cupRate: number;

  constructor(raw: WooProduct, cupRate = 700) {
    this.raw = raw;
    this.cupRate = cupRate;
  }

  // ----------------------------------------------------------
  // Identidad
  // ----------------------------------------------------------

  get id(): number {
    return this.raw.id;
  }

  get name(): string {
    return this.raw.name;
  }

  get slug(): string {
    return this.raw.slug;
  }

  get sku(): string {
    return this.raw.sku;
  }

  get permalink(): string {
    return this.raw.permalink;
  }

  get description(): string {
    return this.raw.description;
  }

  get shortDescription(): string {
    return this.raw.short_description;
  }

  get featured(): boolean {
    return this.raw.featured;
  }

  // ----------------------------------------------------------
  // Precios (USD y CUP)
  // ----------------------------------------------------------

  get price(): number {
    return toFloat(this.raw.price);
  }

  get priceCUP(): number {
    return Math.round(this.price * this.cupRate);
  }

  get priceCUPFormatted(): string {
    return `${this.priceCUP.toLocaleString('en-US')} CUP`;
  }

  get priceFormatted(): string {
    return `$${this.price % 1 === 0 ? this.price.toFixed(0) : this.price.toFixed(2)} USD / ${this.priceCUPFormatted}`;
  }

  get regularPrice(): number {
    return toFloat(this.raw.regular_price) || toFloat(this.raw.price);
  }

  get regularPriceCUP(): number {
    return Math.round(this.regularPrice * this.cupRate);
  }

  get regularPriceCUPFormatted(): string {
    return `${this.regularPriceCUP.toLocaleString('en-US')} CUP`;
  }

  get regularPriceFormatted(): string {
    return `$${this.regularPrice.toFixed(2)} USD / ${this.regularPriceCUPFormatted}`;
  }

  get salePrice(): number | null {
    return this.raw.sale_price ? Number.parseFloat(this.raw.sale_price) : null;
  }

  get salePriceCUP(): number | null {
    return this.salePrice !== null ? Math.round(this.salePrice * this.cupRate) : null;
  }

  get salePriceFormatted(): string | null {
    return this.salePrice !== null
      ? `$${this.salePrice.toFixed(2)} USD / ${this.salePriceCUP!.toLocaleString('en-US')} CUP`
      : null;
  }

  get isOnSale(): boolean {
    return this.raw.on_sale || this.salePrice !== null;
  }

  /** Porcentaje de descuento redondeado (0 si no está en oferta). */
  get discountPercent(): number {
    if (!this.isOnSale || this.regularPrice <= 0) return 0;
    const discount = ((this.regularPrice - this.price) / this.regularPrice) * 100;
    return Math.max(0, Math.round(discount));
  }

  // ----------------------------------------------------------
  // Stock
  // ----------------------------------------------------------

  get stockQuantity(): number | null {
    return this.raw.stock_quantity;
  }

  get stockStatus(): WooStockStatus {
    return this.raw.stock_status;
  }

  get isInStock(): boolean {
    return this.raw.stock_status === 'instock';
  }

  get isLowStock(): boolean {
    return (
      this.isInStock &&
      this.stockQuantity !== null &&
      this.stockQuantity <= LOW_STOCK_THRESHOLD
    );
  }

  // ----------------------------------------------------------
  // Popularidad y valoración
  // ----------------------------------------------------------

  get totalSales(): number {
    return this.raw.total_sales;
  }

  get rating(): number {
    return toFloat(this.raw.average_rating);
  }

  get ratingCount(): number {
    return this.raw.rating_count;
  }

  /** True si el producto lleva la etiqueta "Tendencias". */
  get isTrending(): boolean {
    return (this.raw.tags ?? []).some(
      (tag) =>
        TRENDING_TAG_SLUGS.includes(tag.slug) ||
        tag.name?.toLowerCase() === TRENDING_TAG_NAME.toLowerCase(),
    );
  }

  // ----------------------------------------------------------
  // Imágenes, categorías y etiquetas
  // ----------------------------------------------------------

  get primaryImage(): string {
    return this.raw.images?.[0]?.src ?? '';
  }

  get images(): string[] {
    return (this.raw.images ?? []).map((image: WooImage) => image.src);
  }

  /** True si la imagen principal es real (no el placeholder "Sin Imagen" de placehold.co). */
  get hasRealImage(): boolean {
    return this.primaryImage !== '' && !this.primaryImage.includes('placehold.co');
  }

  get categories(): WooCategory[] {
    return this.raw.categories ?? [];
  }

  get tags(): WooTag[] {
    return this.raw.tags ?? [];
  }

  get categoryName(): string {
    return this.categories[0]?.name ?? '';
  }

  // ----------------------------------------------------------
  // Conversiones
  // ----------------------------------------------------------

  /** Datos listos para `ProductCard.astro`. */
  toCard(): ProductCardData {
    return {
      title: this.name,
      price: this.priceFormatted,
      regularPrice: this.isOnSale ? this.regularPriceFormatted : undefined,
      priceUSD: this.price,
      priceCUP: this.priceCUP,
      cupRate: this.cupRate,
      regularPriceUSD: this.isOnSale ? this.regularPrice : undefined,
      regularPriceCUP: this.isOnSale ? this.regularPriceCUP : undefined,
      image: this.primaryImage,
      category: this.categoryName,
      isTrending: this.isTrending,
      permalink: this.permalink,
    };
  }

  toJSON(): ProductData {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      sku: this.sku,
      permalink: this.permalink,
      description: this.description,
      shortDescription: this.shortDescription,
      price: this.price,
      priceCUP: this.priceCUP,
      cupRate: this.cupRate,
      priceFormatted: this.priceFormatted,
      regularPrice: this.regularPrice,
      regularPriceCUP: this.regularPriceCUP,
      regularPriceFormatted: this.regularPriceFormatted,
      salePrice: this.salePrice,
      salePriceCUP: this.salePriceCUP,
      salePriceFormatted: this.salePriceFormatted,
      isOnSale: this.isOnSale,
      discountPercent: this.discountPercent,
      stockQuantity: this.stockQuantity,
      stockStatus: this.stockStatus,
      isInStock: this.isInStock,
      isLowStock: this.isLowStock,
      totalSales: this.totalSales,
      rating: this.rating,
      ratingCount: this.ratingCount,
      featured: this.featured,
      primaryImage: this.primaryImage,
      images: this.images,
      categories: this.categories,
      tags: this.tags,
    };
  }

  static fromArray(raw: WooProduct[], cupRate = 700): Product[] {
    return raw.map((product) => new Product(product, cupRate));
  }
}