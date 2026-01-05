// Rate Limiting Middleware using in-memory cache
// For production, use Redis with @upstash/ratelimit

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store (reset on server restart - use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
    windowMs: number;  // Time window in milliseconds
    maxRequests: number;  // Max requests per window
}

const DEFAULT_CONFIG: RateLimitConfig = {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 10,
};

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetIn: number;  // milliseconds until reset
}

/**
 * Check rate limit for a given key
 * @param key - Unique identifier (userId, IP, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(key: string, config: RateLimitConfig = DEFAULT_CONFIG): RateLimitResult {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
        cleanupExpiredEntries();
    }

    if (!entry || now >= entry.resetTime) {
        // First request or window expired - reset
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + config.windowMs,
        });
        return {
            success: true,
            remaining: config.maxRequests - 1,
            resetIn: config.windowMs,
        };
    }

    if (entry.count >= config.maxRequests) {
        // Rate limit exceeded
        return {
            success: false,
            remaining: 0,
            resetIn: entry.resetTime - now,
        };
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);

    return {
        success: true,
        remaining: config.maxRequests - entry.count,
        resetIn: entry.resetTime - now,
    };
}

function cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now >= entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}

// Pre-configured rate limiters
export const rateLimiters = {
    // Payment operations: 10 per minute
    payment: (userId: string) => checkRateLimit(`payment:${userId}`, {
        windowMs: 60 * 1000,
        maxRequests: 10,
    }),

    // Withdrawal: 5 per hour
    withdrawal: (userId: string) => checkRateLimit(`withdrawal:${userId}`, {
        windowMs: 60 * 60 * 1000,
        maxRequests: 5,
    }),

    // General API: 100 per minute
    api: (ip: string) => checkRateLimit(`api:${ip}`, {
        windowMs: 60 * 1000,
        maxRequests: 100,
    }),

    // Auth attempts: 5 per 15 minutes
    auth: (ip: string) => checkRateLimit(`auth:${ip}`, {
        windowMs: 15 * 60 * 1000,
        maxRequests: 5,
    }),
};

/**
 * Helper to get rate limit headers
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetIn / 1000).toString(),
    };
}
