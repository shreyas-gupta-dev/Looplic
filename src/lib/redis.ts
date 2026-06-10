import { Redis } from "@upstash/redis";

let redisClient: Redis | null | undefined;

function getRedisClient() {
  if (redisClient !== undefined) {
    return redisClient;
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = null;
    return redisClient;
  }

  redisClient = Redis.fromEnv();
  return redisClient;
}

export async function withRedisCache<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
  const redis = getRedisClient();

  if (!redis) {
    return load();
  }

  try {
    const cached = await redis.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
  } catch {
    // Redis must never block the booking or catalog flow.
  }

  const fresh = await load();

  try {
    await redis.set(key, fresh, { ex: ttlSeconds });
  } catch {
    // Keep serving the fresh Supabase result if Redis writes fail.
  }

  return fresh;
}

export async function deleteRedisKeysByPrefix(prefixes: string[]) {
  const redis = getRedisClient();

  if (!redis || prefixes.length === 0) {
    return 0;
  }

  let deleted = 0;

  for (const prefix of prefixes) {
    try {
      const keys = await redis.keys(`${prefix}*`);
      if (keys.length > 0) {
        deleted += await redis.del(...keys);
      }
    } catch {
      // Next revalidation should still succeed even if Redis purge fails.
    }
  }

  return deleted;
}
