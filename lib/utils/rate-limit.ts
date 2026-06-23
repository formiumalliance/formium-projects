// lib/utils/rate-limit.ts
// Simple in-memory rate limiter for API routes
// For production with multiple instances, replace store with Redis

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitOptions {
  windowMs: number   // Time window in milliseconds
  max: number        // Max requests per window
  keyFn?: (req: NextRequest) => string  // Custom key extractor
}

interface HitRecord {
  count: number
  resetAt: number
}

// In-memory store — replace with Redis in multi-instance deployment
const store = new Map<string, HitRecord>()

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    store.forEach((record, key) => {
      if (record.resetAt < now) store.delete(key)
    })
  }, 5 * 60 * 1000)
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, keyFn } = options

  return function check(req: NextRequest): NextResponse | null {
    const key = keyFn ? keyFn(req) : `rl:${getClientIp(req)}:${new URL(req.url).pathname}`
    const now = Date.now()

    let record = store.get(key)

    if (!record || record.resetAt < now) {
      record = { count: 1, resetAt: now + windowMs }
      store.set(key, record)
      return null // OK
    }

    record.count++

    if (record.count > max) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000)
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.', retryAfter },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(max),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(record.resetAt),
          },
        }
      )
    }

    return null // OK
  }
}

// Pre-configured limiters
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                    // 10 auth attempts per IP per 15 min
  keyFn: (req) => `auth:${getClientIp(req)}`,
})

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,             // 100 requests per minute per IP
})

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,              // 20 uploads per minute
})

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,                     // 5 reset attempts per IP per hour
  keyFn: (req) => `reset:${getClientIp(req)}`,
})
