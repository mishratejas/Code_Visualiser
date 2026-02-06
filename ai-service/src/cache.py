import redis.asyncio as redis
from redis.asyncio import ConnectionPool
from src.config import settings
import json
from typing import Optional, Any

# Redis connection pool
pool: Optional[ConnectionPool] = None
redis_client: Optional[redis.Redis] = None

async def init_redis():
    """Initialize Redis connection"""
    global pool, redis_client
    pool = ConnectionPool.from_url(settings.REDIS_URL, decode_responses=True)
    redis_client = redis.Redis.from_pool(pool)
    await redis_client.ping()
    print("✅ Redis connected successfully")

async def close_redis():
    """Close Redis connection"""
    if pool:
        await pool.disconnect()

async def get_cache(key: str) -> Optional[Any]:
    """Get value from cache"""
    if not redis_client:
        return None
    
    value = await redis_client.get(key)
    if value:
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value
    return None

async def set_cache(key: str, value: Any, expire: int = 3600):
    """Set value in cache"""
    if not redis_client:
        return
    
    if isinstance(value, (dict, list)):
        value = json.dumps(value)
    
    await redis_client.setex(key, expire, value)

async def delete_cache(key: str):
    """Delete key from cache"""
    if redis_client:
        await redis_client.delete(key)

async def clear_pattern(pattern: str):
    """Clear cache keys matching pattern"""
    if redis_client:
        keys = await redis_client.keys(pattern)
        if keys:
            await redis_client.delete(*keys)