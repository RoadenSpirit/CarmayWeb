import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { RateLimiter } from './RateLimiter.js';
import { wooConfig } from '../config.js';

export interface WooCommerceClientOptions {
  apiUrl?: string;
  consumerKey?: string;
  consumerSecret?: string;
  timeoutMs?: number;
  maxRequestsPerSecond?: number;
  perPage?: number;
  cacheEnabled?: boolean;
  cacheTtlMs?: number;
}

export interface RequestOptions {
  cache?: boolean;
  cacheTtlMs?: number;
}

export type WooQueryParams = Record<string, string | number | boolean | undefined>;

const DEFAULT_RETRIES = 3;
const MAX_PAGE_SIZE = 100;

/**
 * Cliente HTTP central para la API REST de WooCommerce.
 *
 * Responsabilidades:
 *  - Autenticación por query-string (Hostinger no expone el header
 *    `Authorization` a PHP, así que Basic Auth por header no funciona).
 *  - Rate limiting (respeta el límite de peticiones por segundo).
 *  - Reintentos con backoff exponencial ante 429/5xx.
 *  - Timeout por petición.
 *  - Paginación automática (`getAll`) respetando el tamaño de página.
 *  - Caché en disco (`.wc-cache/`) para no golpear la API en cada build.
 */
export class WooCommerceClient {
  readonly apiUrl: string;
  readonly perPage: number;

  private readonly consumerKey: string;
  private readonly consumerSecret: string;
  private readonly timeoutMs: number;
  private readonly limiter: RateLimiter;
  private readonly cacheEnabled: boolean;
  private readonly cacheTtlMs: number;
  private readonly cacheDir: string;

  constructor(options: WooCommerceClientOptions = {}) {
    this.apiUrl = (options.apiUrl ?? wooConfig.apiUrl).replace(/\/+$/, '');
    this.consumerKey = options.consumerKey ?? wooConfig.consumerKey;
    this.consumerSecret = options.consumerSecret ?? wooConfig.consumerSecret;
    this.timeoutMs = options.timeoutMs ?? wooConfig.timeoutMs;
    this.perPage = Math.min(options.perPage ?? wooConfig.perPage, MAX_PAGE_SIZE);
    this.limiter = new RateLimiter(options.maxRequestsPerSecond ?? wooConfig.maxRequestsPerSecond);
    this.cacheEnabled = options.cacheEnabled ?? wooConfig.cacheEnabled;
    this.cacheTtlMs = options.cacheTtlMs ?? wooConfig.cacheTtlMs;
    this.cacheDir = path.join(process.cwd(), '.wc-cache');
  }

  /**
   * Construye la URL completa incluyendo la autenticación por query-string.
   */
  private buildUrl(endpoint: string, params: WooQueryParams = {}): string {
    if (!this.consumerKey || !this.consumerSecret) {
      throw new Error(
        'Faltan credenciales de WooCommerce (WC_CONSUMER_KEY / WC_CONSUMER_SECRET). Configúralas en .env.',
      );
    }

    const url = new URL(`${this.apiUrl}/${endpoint.replace(/^\//, '')}`);

    url.searchParams.set('consumer_key', this.consumerKey);
    url.searchParams.set('consumer_secret', this.consumerSecret);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }

    return url.toString();
  }

  // ----------------------------------------------------------
  // Caché en disco
  // ----------------------------------------------------------

  private cacheKey(url: string): string {
    return createHash('sha256').update(url).digest('hex');
  }

  private cacheFileFor(url: string): string {
    return path.join(this.cacheDir, `${this.cacheKey(url)}.json`);
  }

  private async readCache(url: string, ttlMs: number): Promise<string | null> {
    if (!this.cacheEnabled) return null;

    const file = this.cacheFileFor(url);
    try {
      const stat = await fs.stat(file);
      if (Date.now() - stat.mtimeMs > ttlMs) return null;
      return await fs.readFile(file, 'utf8');
    } catch {
      return null;
    }
  }

  private async writeCache(url: string, body: string): Promise<void> {
    if (!this.cacheEnabled) return;

    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      await fs.writeFile(this.cacheFileFor(url), body, 'utf8');
    } catch {
      // Los fallos de caché no deben romper la petición.
    }
  }

  // ----------------------------------------------------------
  // Petición con reintentos
  // ----------------------------------------------------------

  private async request(url: string, options: RequestOptions = {}): Promise<unknown> {
    const ttlMs = options.cacheTtlMs ?? this.cacheTtlMs;
    const useCache = options.cache ?? this.cacheEnabled;

    if (useCache) {
      const cached = await this.readCache(url, ttlMs);
      if (cached !== null) return JSON.parse(cached);
    }

    await this.limiter.waitForSlot();

    let lastError: unknown = new Error('Petición a WooCommerce fallida sin motivo conocido');

    for (let attempt = 0; attempt < DEFAULT_RETRIES; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url, { signal: controller.signal });

        // 429 (rate limit) o errores de servidor → reintentar con backoff.
        if (response.status === 429 || response.status >= 500) {
          const waitMs = Math.min(1000 * 2 ** attempt, 5000);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }

        if (!response.ok) {
          const body = await response.text();
          throw new Error(
            `WooCommerce API ${response.status} ${response.statusText} — ${body.slice(0, 300)}`,
          );
        }

        const text = await response.text();
        if (useCache) await this.writeCache(url, text);
        return JSON.parse(text);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          lastError = new Error(`Timeout: la petición excedió ${this.timeoutMs}ms (intento ${attempt + 1})`);
        } else {
          lastError = err;
        }
      } finally {
        clearTimeout(timer);
      }
    }

    throw lastError;
  }

  // ----------------------------------------------------------
  // Métodos públicos
  // ----------------------------------------------------------

  /**
   * Ejecuta una petición GET tipada a un endpoint de WooCommerce.
   */
  async get<T>(endpoint: string, params: WooQueryParams = {}, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(endpoint, params);
    return (await this.request(url, options)) as T;
  }

  /**
   * Recupera TODOS los registros de un endpoint recorriendo las páginas.
   * Respetando `per_page` (máx. 100) y el rate limit.
   */
  async getAll<T>(endpoint: string, params: WooQueryParams = {}, options: RequestOptions = {}): Promise<T[]> {
    const perPage = typeof params.per_page === 'number' ? params.per_page : this.perPage;
    const results: T[] = [];
    let page = 1;

    for (;;) {
      const batch = await this.get<T[]>(endpoint, { ...params, per_page: perPage, page }, options);
      results.push(...batch);

      if (batch.length < perPage) break;
      page += 1;
    }

    return results;
  }
}