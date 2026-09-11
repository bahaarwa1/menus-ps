/**
 * High-performance Sliding-Window Rate Limiter with Auto-Lockout.
 * 
 * SECURITY:
 * - Tracks per-IP, per-route limits independently.
 * - Progressive lockout: after 3 failures → 5min lockout.
 * - Periodic cleanup prevents memory exhaustion.
 */

interface RateLimitRecord {
  timestamps: number[];
  lockoutUntil?: number;
  failureCount: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetInSeconds: number;
  lockedOut?: boolean;
}

class SlidingWindowRateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();
  private lastCleanup = Date.now();

  /**
   * Checks whether an action is permitted within the rate limit.
   * 
   * @param key Unique key (e.g. `login:1.2.3.4` or `pin:1.2.3.4`)
   * @param maxRequests Maximum allowed requests in the window
   * @param windowSeconds Window length in seconds
   */
  check(key: string, maxRequests: number, windowSeconds = 60): RateLimitResult {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowStart = now - windowMs;

    // Periodic cleanup every 5 minutes to prevent memory leak
    if (now - this.lastCleanup > 300_000) {
      this.cleanup(windowStart);
      this.lastCleanup = now;
    }

    let record = this.records.get(key);
    if (!record) {
      record = { timestamps: [], failureCount: 0 };
      this.records.set(key, record);
    }

    // Check lockout (progressive backoff)
    if (record.lockoutUntil && now < record.lockoutUntil) {
      const resetInSeconds = Math.ceil((record.lockoutUntil - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        limit: maxRequests,
        resetInSeconds,
        lockedOut: true,
      };
    }

    // Sliding window: filter out old timestamps
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= maxRequests) {
      const oldest = record.timestamps[0];
      const resetInSeconds = Math.ceil((oldest + windowMs - now) / 1000);
      // Increment failure count and apply progressive lockout
      record.failureCount++;
      if (record.failureCount >= 3) {
        // Lock out for 5 minutes after 3 rate limit violations
        record.lockoutUntil = now + 5 * 60 * 1000;
      }
      return {
        allowed: false,
        remaining: 0,
        limit: maxRequests,
        resetInSeconds: Math.max(resetInSeconds, 1),
      };
    }

    // Allow the request
    record.timestamps.push(now);

    return {
      allowed: true,
      remaining: maxRequests - record.timestamps.length,
      limit: maxRequests,
      resetInSeconds: windowSeconds,
    };
  }

  /**
   * Records a failed authentication attempt (separate from request counting).
   * Used for progressive lockout on auth failures.
   * @param key The key to track failures for
   * @param lockoutThreshold Failures before lockout (default: 5)
   * @param lockoutMinutes Lockout duration in minutes (default: 15)
   */
  recordFailure(key: string, lockoutThreshold = 5, lockoutMinutes = 15): void {
    const now = Date.now();
    let record = this.records.get(key);
    if (!record) {
      record = { timestamps: [], failureCount: 0 };
      this.records.set(key, record);
    }
    record.failureCount++;
    if (record.failureCount >= lockoutThreshold) {
      record.lockoutUntil = now + lockoutMinutes * 60 * 1000;
    }
  }

  /**
   * Resets the failure count on successful auth (prevents unnecessary lockout).
   */
  recordSuccess(key: string): void {
    const record = this.records.get(key);
    if (record) {
      record.failureCount = 0;
      record.lockoutUntil = undefined;
    }
  }

  /**
   * Checks if a key is currently locked out.
   */
  isLockedOut(key: string): { locked: boolean; remainingSeconds: number } {
    const now = Date.now();
    const record = this.records.get(key);
    if (!record?.lockoutUntil || now >= record.lockoutUntil) {
      return { locked: false, remainingSeconds: 0 };
    }
    return {
      locked: true,
      remainingSeconds: Math.ceil((record.lockoutUntil - now) / 1000),
    };
  }

  reset(key: string): void {
    this.records.delete(key);
  }

  private cleanup(windowStart: number): void {
    const now = Date.now();
    this.records.forEach((record, key) => {
      record.timestamps = record.timestamps.filter((ts) => ts > windowStart);
      // Remove expired lockouts
      if (record.lockoutUntil && now >= record.lockoutUntil) {
        record.lockoutUntil = undefined;
        record.failureCount = 0;
      }
      if (record.timestamps.length === 0 && !record.lockoutUntil) {
        this.records.delete(key);
      }
    });
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
