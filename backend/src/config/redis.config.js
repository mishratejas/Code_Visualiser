import Redis from 'ioredis';

let redis;

const REDIS_URL = process.env.REDIS_URL || '';
const isUpstash = REDIS_URL.startsWith('rediss://') || REDIS_URL.startsWith('redis://');

if (isUpstash) {
  // Upstash connection — use URL directly with TLS and no ready check
  // (Upstash doesn't support CLIENT SETNAME which ready check uses → causes EPIPE/ECONNRESET)
  redis = new Redis(REDIS_URL, {
    tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,  // null = retry indefinitely (avoids MaxRetriesPerRequestError)
    enableOfflineQueue: true,
    connectTimeout: 15000,
    lazyConnect: false,
    retryStrategy(times) {
      if (times > 10) return null; // stop retrying after 10 attempts
      return Math.min(times * 200, 5000);
    },
  });
} else {
  // Local dev connection
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    enableOfflineQueue: true,
    connectTimeout: 10000,
    keepAlive: 30000,
    retryStrategy(times) {
      return Math.min(times * 50, 2000);
    },
    reconnectOnError(err) {
      return err.message.includes('READONLY');
    },
  });
}

redis.on('connect', () => console.log('✅ Redis: Connected to server'));
redis.on('ready',   () => console.log('✅ Redis: Ready to accept commands'));
redis.on('error',   (err) => console.error('❌ Redis error:', err.message));
redis.on('close',   () => console.log('⚠️ Redis: Connection closed'));
redis.on('reconnecting', () => console.log('🔄 Redis: Reconnecting...'));
redis.on('end',     () => console.log('⛔ Redis: Connection ended'));

export default redis;