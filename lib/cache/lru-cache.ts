/**
 * High-performance In-Memory LRU Cache with TTL and Tag Invalidation.
 * Engineered for high-traffic public QR menu surges (1,000+ concurrent users).
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRatio: string;
}

class LRUCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly maxSize: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  /**
   * Gets a value from cache if present and not expired.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Refresh LRU order: delete and re-insert
    this.cache.delete(key);
    this.cache.set(key, entry as CacheEntry<unknown>);

    this.hits++;
    return entry.value;
  }

  /**
   * Sets a value in cache with TTL (in seconds) and optional tags for invalidation.
   */
  set<T>(key: string, value: T, ttlSeconds = 60, tags: string[] = []): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict oldest (first key in map)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
      tags,
    });
  }

  /**
   * Invalidates all keys associated with a specific tag.
   */
  invalidateTag(tag: string): number {
    let count = 0;
    this.cache.forEach((entry, key) => {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    });
    return count;
  }

  /**
   * Invalidates a specific key.
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clears the entire cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Returns current cache operational statistics.
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRatio = total > 0 ? `${((this.hits / total) * 100).toFixed(1)}%` : '0.0%';
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRatio,
    };
  }
}

// Global cache singleton across Next.js invocations
declare global {
  // eslint-disable-next-line no-var
  var __menusGlobalLRUCache: LRUCache | undefined;
}

if (!global.__menusGlobalLRUCache) {
  global.__menusGlobalLRUCache = new LRUCache(2000);
}

export const appCache: LRUCache = global.__menusGlobalLRUCache;
