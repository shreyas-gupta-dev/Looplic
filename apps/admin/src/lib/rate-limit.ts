import { Redis } from "@upstash/redis";

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number | null;
};

let rateLimitRedis: Redis | null | undefined;

function getRedisClient() {
  if (rateLimitRedis !== undefined) {
    return rateLimitRedis;
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    rateLimitRedis = null;
    return rateLimitRedis;
  }

  rateLimitRedis = Redis.fromEnv();
  return rateLimitRedis;
}

function normalizeKeyPart(value: string) {
  return value.replace(/[^a-zA-Z0-9:_-]+/g, "_").slice(0, 120);
}

export function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || request.headers.get("cf-connecting-ip") || "unknown";
}

export async function enforceRateLimit(request: Request, scope: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const redis = getRedisClient();

  if (!redis) {
    return { allowed: true, limit, remaining: limit, resetAt: null };
  }

  const ip = normalizeKeyPart(getRequestIp(request));
  const key = `looplic:rate-limit:${normalizeKeyPart(scope)}:${ip}`;

  try {
    const current = Number(await redis.incr(key));
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    const ttl = await redis.ttl(key).catch(() => -1);
    return {
      allowed: current <= limit,
      limit,
      remaining: Math.max(0, limit - current),
      resetAt: ttl > 0 ? Date.now() + ttl * 1000 : null,
    };
  } catch {
    return { allowed: true, limit, remaining: limit, resetAt: null };
  }
}
