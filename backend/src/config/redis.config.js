import Redis from 'ioredis';

// If REDIS_URL is provided (e.g. Upstash rediss://...), use it directly.
// Otherwise fall back to individual host/port/password vars (local dev).
const isUpstash = process.env.REDIS_URL && process.env.REDIS_URL.startsWith('rediss://');

const redisConfig = isUpstash
  ? {
      // Upstash / TLS connection via URL
      // ioredis parses the URL and enables TLS automatically with rediss://
      // but we also set tls:{} explicitly to avoid ECONNRESET on some hosts
      tls: {},
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,   // Upstash doesn't support CLIENT SETNAME used by readyCheck
      enableOfflineQueue: true,
      connectTimeout: 10000,
      retryStrategy(times) {
        return Math.min(times * 100, 3000);
      },
    }
  : {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB) || 0,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: true,
      connectTimeout: 10000,
      keepAlive: 30000,
      retryStrategy(times) {
        return Math.min(times * 50, 2000);
      },
      reconnectOnError(err) {
        return err.message.includes('READONLY');
      },
    };

const redis = isUpstash
  ? new Redis(process.env.REDIS_URL, redisConfig)
  : new Redis(redisConfig);

redis.on('connect', () => {
  console.log('✅ Redis: Connected to server');
});

redis.on('ready', () => {
  console.log('✅ Redis: Ready to accept commands');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

redis.on('close', () => {
  console.log('⚠️ Redis: Connection closed');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis: Reconnecting...');
});

redis.on('end', () => {
  console.log('⛔ Redis: Connection ended');
});

export default redis;