"""
Cache module — Redis with in-memory fallback.
No changes to interface, just cleaned up.
"""
import json
import asyncio
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)

try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False


class CacheManager:
    def __init__(self):
        self._redis = None
        self._mem: dict = {}
        self.connected = False

    async def connect(self):
        if not REDIS_AVAILABLE:
            logger.warning("redis not installed — using in-memory cache")
            return
        try:
            from src.config import Config
            self._redis = aioredis.from_url(Config.REDIS_URL, encoding="utf-8", decode_responses=True)
            await self._redis.ping()
            self.connected = True
            logger.info("Redis connected")
        except Exception as e:
            logger.warning(f"Redis unavailable ({e}) — falling back to in-memory cache")
            self._redis = None
            self.connected = False

    async def get(self, key: str) -> Optional[Any]:
        try:
            if self.connected and self._redis:
                val = await self._redis.get(key)
                return json.loads(val) if val else None
            return self._mem.get(key)
        except Exception:
            return None

    async def set(self, key: str, value: Any, expire: Optional[int] = None) -> bool:
        try:
            serialized = json.dumps(value, default=str)
            if self.connected and self._redis:
                if expire:
                    await self._redis.setex(key, expire, serialized)
                else:
                    await self._redis.set(key, serialized)
            else:
                self._mem[key] = value
                if expire:
                    asyncio.create_task(self._expire(key, expire))
            return True
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False

    async def delete(self, key: str):
        if self.connected and self._redis:
            await self._redis.delete(key)
        else:
            self._mem.pop(key, None)

    async def _expire(self, key: str, seconds: int):
        await asyncio.sleep(seconds)
        self._mem.pop(key, None)

    async def close(self):
        if self.connected and self._redis:
            await self._redis.aclose()
            self.connected = False


cache_manager = CacheManager()


async def get_cache(key: str) -> Optional[Any]:
    return await cache_manager.get(key)


async def set_cache(key: str, value: Any, expire: Optional[int] = None) -> bool:
    return await cache_manager.set(key, value, expire)


async def delete_cache(key: str):
    await cache_manager.delete(key)