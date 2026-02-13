"""
Cache module for Redis caching with in-memory fallback
"""
import json
import asyncio
from typing import Any, Optional
from datetime import timedelta

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from src.config import config


class CacheManager:
    """
    Cache manager with Redis backend and in-memory fallback
    """
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.memory_cache: dict = {}
        self.connected = False
        
    async def connect(self):
        """Connect to Redis"""
        if not REDIS_AVAILABLE:
            print("⚠️  Redis not available, using in-memory cache")
            return
            
        try:
            redis_url = config.get('REDIS_URL', 'redis://localhost:6379')
            self.redis_client = redis.from_url(
                redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            # Test connection
            await self.redis_client.ping()
            self.connected = True
            print("✅ Redis cache connected")
        except Exception as e:
            print(f"⚠️  Redis connection failed: {e}. Using in-memory cache.")
            self.redis_client = None
            self.connected = False
    
    async def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None
        """
        try:
            if self.connected and self.redis_client:
                value = await self.redis_client.get(key)
                if value:
                    return json.loads(value)
            else:
                # Fallback to memory cache
                return self.memory_cache.get(key)
        except Exception as e:
            print(f"Cache get error for key '{key}': {e}")
            return None
    
    async def set(
        self, 
        key: str, 
        value: Any, 
        expire: Optional[int] = None
    ) -> bool:
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
            serialized = json.dumps(value)
            
            if self.connected and self.redis_client:
                if expire:
                    await self.redis_client.setex(key, expire, serialized)
                else:
                    await self.redis_client.set(key, serialized)
            else:
                # Fallback to memory cache
                self.memory_cache[key] = value
                
                # Simple expiration for memory cache
                if expire:
                    asyncio.create_task(self._expire_memory_key(key, expire))
            
            return True
        except Exception as e:
            print(f"Cache set error for key '{key}': {e}")
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
            if self.connected and self.redis_client:
                await self.redis_client.delete(key)
            else:
                self.memory_cache.pop(key, None)
            return True
        except Exception as e:
            print(f"Cache delete error for key '{key}': {e}")
            return False
    
    async def clear(self) -> bool:
        """
        Clear all cache
        
        Returns:
            True if successful
        """
        try:
            if self.connected and self.redis_client:
                await self.redis_client.flushdb()
            else:
                self.memory_cache.clear()
            return True
        except Exception as e:
            print(f"Cache clear error: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """
        Check if key exists
        
        Args:
            key: Cache key
            
        Returns:
            True if key exists
        """
        try:
            if self.connected and self.redis_client:
                return await self.redis_client.exists(key) > 0
            else:
                return key in self.memory_cache
        except Exception as e:
            print(f"Cache exists error for key '{key}': {e}")
            return False
    
    async def _expire_memory_key(self, key: str, seconds: int):
        """Expire key from memory cache after seconds"""
        await asyncio.sleep(seconds)
        self.memory_cache.pop(key, None)
    
    async def close(self):
        """Close Redis connection"""
        if self.connected and self.redis_client:
            await self.redis_client.close()
            self.connected = False


# Global cache manager instance
_cache_manager: Optional[CacheManager] = None


async def get_cache_manager() -> CacheManager:
    """
    Get or create cache manager instance
    
    Returns:
        CacheManager instance
    """
    global _cache_manager
    
    if _cache_manager is None:
        _cache_manager = CacheManager()
        await _cache_manager.connect()
    
    return _cache_manager


# Convenience functions
async def get_cache(key: str) -> Optional[Any]:
    """Get value from cache"""
    manager = await get_cache_manager()
    return await manager.get(key)


async def set_cache(
    key: str, 
    value: Any, 
    expire: Optional[int] = None
) -> bool:
    """Set value in cache"""
    manager = await get_cache_manager()
    return await manager.set(key, value, expire)


async def delete_cache(key: str) -> bool:
    """Delete key from cache"""
    manager = await get_cache_manager()
    return await manager.delete(key)


async def clear_cache() -> bool:
    """Clear all cache"""
    manager = await get_cache_manager()
    return await manager.clear()


async def cache_exists(key: str) -> bool:
    """Check if key exists in cache"""
    manager = await get_cache_manager()
    return await manager.exists(key)