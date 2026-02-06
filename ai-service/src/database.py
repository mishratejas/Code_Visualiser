"""
Database connection and utilities
"""
import os
from typing import Optional
import logging
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

# Try to import database libraries
try:
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    SQLALCHEMY_AVAILABLE = True
except ImportError:
    SQLALCHEMY_AVAILABLE = False
    logger.warning("SQLAlchemy not available. Database operations will be disabled.")


class DatabaseManager:
    """Manager for database connections"""
    
    def __init__(self):
        self.engine = None
        self.async_session_maker = None
        
        if SQLALCHEMY_AVAILABLE:
            self._init_database()
    
    def _init_database(self):
        """Initialize database connection"""
        database_url = os.getenv("DATABASE_URL", "postgresql://localhost/codeforge")
        
        # Convert to async URL
        if database_url.startswith("postgresql://"):
            database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")
        
        try:
            self.engine = create_async_engine(
                database_url,
                echo=os.getenv("DEBUG", "False").lower() == "true",
                pool_pre_ping=True,
                pool_size=5,
                max_overflow=10
            )
            
            self.async_session_maker = sessionmaker(
                self.engine,
                class_=AsyncSession,
                expire_on_commit=False
            )
            
            logger.info("Database engine initialized")
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            self.engine = None
    
    @asynccontextmanager
    async def get_session(self):
        """
        Get database session
        
        Usage:
            async with db_manager.get_session() as session:
                # Use session
                pass
        """
        if not self.async_session_maker:
            raise RuntimeError("Database not initialized")
        
        async with self.async_session_maker() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
    
    async def close(self):
        """Close database connections"""
        if self.engine:
            await self.engine.dispose()
            logger.info("Database connections closed")


# Global database manager
_db_manager = DatabaseManager()


@asynccontextmanager
async def get_db_session():
    """Get database session"""
    async with _db_manager.get_session() as session:
        yield session


async def close_database():
    """Close database connections"""
    await _db_manager.close()