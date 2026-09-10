/**
 * High-performance In-Memory Sliding-Window Rate Limiter.
 * Defends against brute-force, DoS, and spam order submissions.
 */

interface RateLimitRecord {
  timestamps: number[];
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetInSeconds: number;
}

class SlidingWindowRateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();
  private lastCleanup = Date.now();

  /**
   * Checks whether an action for a given identifier is permitted within the rate limit.
   * 
   * @param key Unique key (e.g. `ip:orders:192.168.1.1` or `table:t12`)
   * @param maxRequests Maximum allowed requests in the window
   * @param windowSeconds Window length in seconds (default 60s)
   */
  check(key: string, maxRequests: number, windowSeconds = 60): RateLimitResult {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowStart = now - windowMs;

    // Periodic sweep every 5 minutes
    if (now - this.lastCleanup > 300000) {
      this.cleanup(windowStart);
      this.lastCleanup = now;
    }

    let record = this.records.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.records.set(key, record);
    }

    // Filter out timestamps outside the sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= maxRequests) {
      const oldest = record.timestamps[0];
      const resetInSeconds = Math.ceil((oldest + windowMs - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        limit: maxRequests,
        resetInSeconds: Math.max(resetInSeconds, 1),
      };
    }

    // Record this request
    record.timestamps.push(now);

    return {
      allowed: true,
      remaining: maxRequests - record.timestamps.length,
      limit: maxRequests,
      resetInSeconds: windowSeconds,
    };
  }

  private cleanup(windowStart: number): void {
    this.records.forEach((record, key) => {
      record.timestamps = record.timestamps.filter((ts) => ts > windowStart);
      if (record.timestamps.length === 0) {
        this.records.delete(key);
      }
    });
  }

  reset(key: string): void {
    this.records.delete(key);
  }
}

// Global singleton for Next.js
declare global {
  // eslint-disable-next-line no-var
  var __menusGlobalRateLimiter: SlidingWindowRateLimiter | undefined;
}

if (!global.__menusGlobalRateLimiter) {
  global.__menusGlobalRateLimiter = new SlidingWindowRateLimiter();
}

export const rateLimiter: SlidingWindowRateLimiter = global.__menusGlobalRateLimiter;
