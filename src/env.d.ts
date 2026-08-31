interface ImportMetaEnv {
  readonly WC_API_URL?: string;
  readonly WC_CONSUMER_KEY?: string;
  readonly WC_CONSUMER_SECRET?: string;
  readonly WC_TIMEOUT_MS?: string;
  readonly WC_MAX_REQUESTS_PER_SECOND?: string;
  readonly WC_PER_PAGE?: string;
  readonly WC_CACHE_ENABLED?: string;
  readonly WC_CACHE_TTL_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}