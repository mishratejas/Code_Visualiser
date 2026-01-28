import Redis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
  
  // Connection options
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
  
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  
  // Timeouts
  connectTimeout: 10000,
  
  // Keep alive
  keepAlive: 30000,
};

const redis = new Redis(redisConfig);

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