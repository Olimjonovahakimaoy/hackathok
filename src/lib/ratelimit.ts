/** Oddiy xotiradagi cheklovchi (bitta server uchun yetarli) */
const g = globalThis as unknown as { __ssRate?: Map<string, number[]> };
const buckets: Map<string, number[]> = (g.__ssRate ??= new Map());

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryInSec: number } {
  const now = Date.now();
  const list = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= limit) {
    buckets.set(key, list);
    return { ok: false, retryInSec: Math.ceil((windowMs - (now - list[0])) / 1000) };
  }
  list.push(now);
  buckets.set(key, list);
  return { ok: true, retryInSec: 0 };
}

export function resetLimit(key: string) {
  buckets.delete(key);
}
