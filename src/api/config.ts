import type { WooCommerceClientOptions } from './client/WooCommerceClient.js';

const env: Record<string, string | undefined> = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};

function toInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return value === 'true' || value === '1';
}

/**
 * Configuración global del cliente de WooCommerce.
 * Lee las variables de entorno de Astro (.env) y aplica valores
 * por defecto seguros para el hosting de Hostinger.
 */
export const wooConfig: Required<Pick<
  WooCommerceClientOptions,
  'apiUrl' | 'consumerKey' | 'consumerSecret' | 'timeoutMs' | 'maxRequestsPerSecond' | 'perPage' | 'cacheEnabled' | 'cacheTtlMs'
>> & { cupExchangeRate: number } = {
  apiUrl: env.WC_API_URL ?? 'https://carmayoutfit.com/wp-json/wc/v3',
  consumerKey: env.WC_CONSUMER_KEY ?? '',
  consumerSecret: env.WC_CONSUMER_SECRET ?? '',
  timeoutMs: toInt(env.WC_TIMEOUT_MS, 30_000),
  maxRequestsPerSecond: toInt(env.WC_MAX_REQUESTS_PER_SECOND, 4),
  perPage: Math.min(toInt(env.WC_PER_PAGE, 100), 100),
  cacheEnabled: toBool(env.WC_CACHE_ENABLED, true),
  cacheTtlMs: toInt(env.WC_CACHE_TTL_MS, 10 * 60 * 1000),
  cupExchangeRate: toInt(env.WC_CUP_EXCHANGE_RATE, 700),
};