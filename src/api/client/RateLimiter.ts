/**
 * Limitador de peticiones simple (throttling por intervalo mínimo).
 * Garantiza que el cliente no supere un máximo de peticiones por
 * segundo, protegiendo a Hostinger de ráfagas.
 */
export class RateLimiter {
  private readonly minIntervalMs: number;
  private lastRequestAt = 0;

  constructor(maxRequestsPerSecond: number) {
    const max = Math.max(1, Math.floor(maxRequestsPerSecond));
    this.minIntervalMs = Math.floor(1000 / max);
  }

  /**
   * Espera hasta que se pueda realizar la siguiente petición.
   */
  async waitForSlot(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestAt;

    if (elapsed < this.minIntervalMs) {
      const waitMs = this.minIntervalMs - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    this.lastRequestAt = Date.now();
  }
}