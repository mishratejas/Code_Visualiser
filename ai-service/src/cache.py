"""
Caching utilities using Redis
"""
import json
import asyncio
from typing import Any, Optional
import logging
import os

logger = logging.getLogger(__name__)

# Try to import Redis, but make it optional
try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("Redis not available. Caching will be disabled.")


class CacheManager:
    """Manager for caching operations"""
    
    def __init__(self):
        self.redis_client = None
        self.cache = {}  # In-memory fallback
        
        if REDIS_AVAILABLE:
            self._init_redis()
    
    def _init_redis(self):
        """Initialize Redis connection"""
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        
        try:
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            logger.info("Redis client initialized")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {e}")
            self.redis_client = None
    
    async def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None
        """
        try:
            if self.redis_client:
                value = await self.redis_client.get(key)
                if value:
                    return json.loads(value)
            else:
                # Fallback to in-memory cache
                return self.cache.get(key)
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None
    
    async def set(self, key: str, value: Any, expire: int = 3600) -> bool:
        """
        Set value in cache
        
        Args:
            key: Cache key
            value: Value to cache
            expire: Expiration time in seconds
            
        Returns:
            True if successful
        """
        try:
            if self.redis_client:
                serialized = json.dumps(value)
                await self.redis_client.setex(key, expire, serialized)
                return True
            else:
                # Fallback to in-memory cache
                self.cache[key] = value
                # Schedule expiration
                asyncio.create_task(self._expire_key(key, expire))
                return True
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """
        Delete key from cache
        
        Args:
            key: Cache key
            
        Returns:
            True if successful
        """
        try:
            if self.redis_client:
                await self.redis_client.delete(key)
            else:
                self.cache.pop(key, None)
            return True
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False
    
    async def clear(self) -> bool:
        """Clear all cache"""
        try:
            if self.redis_client:
                await self.redis_client.flushdb()
            else:
                self.cache.clear()
            return True
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
            return False
    
    async def _expire_key(self, key: str, seconds: int):
        """Expire key after delay (for in-memory cache)"""
        await asyncio.sleep(seconds)
        self.cache.pop(key, None)


# Global cache manager
_cache_manager = CacheManager()


async def get_cache(key: str) -> Optional[Any]:
    """Get value from cache"""
    return await _cache_manager.get(key)


async def set_cache(key: str, value: Any, expire: int = 3600) -> bool:
    """Set value in cache"""
    return await _cache_manager.set(key, value, expire)


async def delete_cache(key: str) -> bool:
    """Delete key from cache"""
    return await _cache_manager.delete(key)


async def clear_cache() -> bool:
    """Clear all cache"""
    return await _cache_manager.clear()