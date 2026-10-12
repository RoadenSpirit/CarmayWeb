import type { WooCategory, WooImage, WooProduct, WooProductAttribute, WooStockStatus, WooTag } from '../types/woocommerce.js';

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
  categorySlug: string;
  isTrending?: boolean;
  permalink: string;
  slug: string;
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
  attributes: WooProductAttribute[];
  colorOptions: string[];
  sizeOptions: string[];
  hasMultipleImages: boolean;
  hasDescription: boolean;
  hasShortDescription: boolean;
  cleanDescription: string;
  cleanShortDescription: string;
  categoryName: string;
  categorySlug: string;
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

  /** Slugs oficiales de categorías permitidas en la web */
  public static readonly VALID_CATEGORY_SLUGS = ['zapatos', 'ropa', 'jackets', 'tecnologia', 'accesorios'];

  /** True si el producto tiene una categoría oficial válida asignada (descarta productos huérfanos o 'sin-categorizar') */
  get hasValidCategory(): boolean {
    const rawSlug = this.categories[0]?.slug ?? '';
    return Product.VALID_CATEGORY_SLUGS.includes(rawSlug);
  }

  get categorySlug(): string {
    const rawSlug = this.categories[0]?.slug ?? '';
    return Product.VALID_CATEGORY_SLUGS.includes(rawSlug) ? rawSlug : '';
  }

  get categoryName(): string {
    const slug = this.categorySlug;
    const names: Record<string, string> = {
      zapatos: 'Calzado',
      ropa: 'Ropa',
      jackets: 'Bolsos y Mochilas',
      tecnologia: 'Tecnología',
      accesorios: 'Accesorios',
    };
    return names[slug] || '';
  }

  // ----------------------------------------------------------
  // Atributos dinámicos (Color, Talla)
  // ----------------------------------------------------------

  get attributes(): WooProductAttribute[] {
    return this.raw.attributes ?? [];
  }

  /** Opciones de color extraídas con jerarquía: Atributos WooCommerce -> Meta Data -> Detección por Nombre -> Fallback de prueba */
  get colorOptions(): string[] {
    // 1. Atributo oficial en WooCommerce
    const attr = this.attributes.find(
      (a) => a.name.toLowerCase() === 'color' || a.name.toLowerCase() === 'colores'
    );
    if (attr && attr.options && attr.options.length > 0) {
      return attr.options;
    }

    // 2. Meta data (_colores o color)
    const metaColor = this.raw.meta_data?.find(
      (m) => m.key === '_colores' || m.key === '_color' || m.key.toLowerCase().includes('color')
    );
    if (metaColor && typeof metaColor.value === 'string' && metaColor.value.trim() !== '') {
      return metaColor.value.split(/[,;\/]/).map((c) => c.trim()).filter(Boolean);
    }

    // 3. Detección inteligente desde el nombre del producto
    const title = this.name.toUpperCase();
    const colorDict: { pattern: RegExp; label: string }[] = [
      { pattern: /\b(?:NGRAS?|NEGROS?|NEGRA|NEGRO)\b/, label: 'Negro' },
      { pattern: /\b(?:BCAS?|BLANCOS?|BLANCA|BLANCO)\b/, label: 'Blanco' },
      { pattern: /\b(?:ROSADAS?|ROSADOS?|ROSA|ROS)\b/, label: 'Rosado' },
      { pattern: /\b(?:CARMELITAS?|CARMELITA)\b/, label: 'Carmelita' },
      { pattern: /\b(?:MARRON(?:ES)?|MARRÓN)\b/, label: 'Marrón' },
      { pattern: /\b(?:CAFES?|CAFÉ)\b/, label: 'Café' },
      { pattern: /\b(?:DORADOS?|DORADA)\b/, label: 'Dorado' },
      { pattern: /\b(?:BEIGES?|BEIGE)\b/, label: 'Beige' },
      { pattern: /\b(?:VERDES?|VERDE)\b/, label: 'Verde' },
      { pattern: /\b(?:AZULES?|AZUL|CELESTE)\b/, label: 'Azul' },
      { pattern: /\b(?:ROJOS?|ROJA)\b/, label: 'Rojo' },
      { pattern: /\b(?:AMARILLOS?|AMARILLA)\b/, label: 'Amarillo' },
      { pattern: /\b(?:GRISES?|GRIS)\b/, label: 'Gris' },
    ];

    const detectedColors: string[] = [];
    for (const c of colorDict) {
      if (c.pattern.test(title) && !detectedColors.includes(c.label)) {
        detectedColors.push(c.label);
      }
    }

    if (detectedColors.length > 0) {
      return detectedColors;
    }

    // 4. Fallback de prueba para evaluación lógica en productos de calzado o ropa
    const cat = this.categorySlug.toLowerCase();
    if (cat === 'zapatos' || cat === 'ropa' || cat === 'jackets') {
      const hash = this.slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const testPalettes = [
        ['Negro', 'Blanco'],
        ['Beige', 'Marrón'],
        ['Negro', 'Rosado'],
        ['Carmelita', 'Café'],
      ];
      return testPalettes[hash % testPalettes.length];
    }

    return [];
  }

  /** Opciones de talla extraídas con jerarquía: Atributos WooCommerce -> Meta Data -> Descripción -> Fallback de prueba */
  get sizeOptions(): string[] {
    // 1. Atributo oficial en WooCommerce
    const attr = this.attributes.find(
      (a) =>
        a.name.toLowerCase() === 'talla' ||
        a.name.toLowerCase() === 'tallas' ||
        a.name.toLowerCase() === 'size' ||
        a.name.toLowerCase() === 'sizes'
    );
    if (attr && attr.options && attr.options.length > 0) {
      return attr.options;
    }

    // 2. Meta data (_tallas o talla)
    const metaSize = this.raw.meta_data?.find(
      (m) => m.key === '_tallas' || m.key === '_talla' || m.key.toLowerCase().includes('talla')
    );
    if (metaSize && typeof metaSize.value === 'string' && metaSize.value.trim() !== '') {
      return metaSize.value.split(/[,;\/]/).map((s) => s.trim()).filter(Boolean);
    }

    // 3. Extracción desde la descripción
    const descMatch = (this.description || '').match(/tallas?\s*:\s*([^\n<]+)/i);
    if (descMatch && descMatch[1]) {
      const parsed = descMatch[1].split(/[,;\/]/).map((s) => s.trim()).filter(Boolean);
      if (parsed.length > 0) return parsed;
    }

    // 4. Fallback de prueba lógico según categoría de moda
    const cat = this.categorySlug.toLowerCase();
    const hash = this.slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    if (cat === 'zapatos') {
      const shoeSizeSets = [
        ['36', '37', '38', '39', '40'],
        ['35-36', '37-38', '39-40'],
        ['37', '38', '39', '40', '41'],
        ['38', '39', '40'],
      ];
      return shoeSizeSets[hash % shoeSizeSets.length];
    }

    if (cat === 'ropa' || cat === 'jackets') {
      const clothingSizeSets = [
        ['S', 'M', 'L', 'XL'],
        ['M', 'L', 'XL'],
        ['Única (S-L)'],
        ['S', 'M', 'L'],
      ];
      return clothingSizeSets[hash % clothingSizeSets.length];
    }

    return [];
  }

  get hasMultipleImages(): boolean {
    return this.images.length > 1;
  }

  /** Limpia la descripción cruda eliminando códigos internos (Código: XXX), precios CUP y secuencias de barras. */
  get cleanDescription(): string {
    const raw = this.description ?? '';
    let text = raw
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/(?:código|codigo|cód|cod)\s*:\s*[^\n<]*/gi, '')
      .replace(/precio\s*(?:cup|usd)?\s*:\s*[^\n<]*/gi, '')
      .replace(/\/\s*\d[\d\/\s]*/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (/^[\d\/\s\-\.\,\:\;]*$/.test(text) || text.length < 5) {
      return '';
    }

    return text;
  }

  get hasDescription(): boolean {
    return this.cleanDescription.length > 0;
  }

  get hasShortDescription(): boolean {
    const desc = this.shortDescription?.replace(/<[^>]*>/g, '').trim();
    return desc.length > 0;
  }

  get cleanShortDescription(): string {
    return this.shortDescription ?? '';
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
      categorySlug: this.categorySlug,
      isTrending: this.isTrending,
      permalink: `/producto/${this.slug}/`,
      slug: this.slug,
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
      attributes: this.attributes,
      colorOptions: this.colorOptions,
      sizeOptions: this.sizeOptions,
      hasMultipleImages: this.hasMultipleImages,
      hasDescription: this.hasDescription,
      hasShortDescription: this.hasShortDescription,
      cleanDescription: this.cleanDescription,
      cleanShortDescription: this.cleanShortDescription,
      categoryName: this.categoryName,
      categorySlug: this.categorySlug,
    };
  }

  static fromArray(raw: WooProduct[], cupRate = 700): Product[] {
    return raw.map((product) => new Product(product, cupRate));
  }
}