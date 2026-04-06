import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let limiter: Ratelimit | null = null

function getLimiter(): Ratelimit | null {
  if (limiter) return limiter
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(120, '1 m'),
    analytics: true,
  })
  return limiter
}

export async function checkRateLimit(identifier: string) {
  const rl = getLimiter()
  if (!rl) return { allowed: true, remaining: 0 }
  try {
    const result = await rl.limit(identifier)
    return { allowed: result.success, remaining: result.remaining }
  } catch {
    return { allowed: true, remaining: 0 } // Redis down = fail open
  }
}
