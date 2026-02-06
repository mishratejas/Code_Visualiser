from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, Boolean
from datetime import datetime
from src.config import settings

Base = declarative_base()
#This is the base class for all ORM models.  Object relational mapping
# Database models
class SubmissionAnalysis(Base):
    __tablename__ = "submission_analysis"
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(String, unique=True, index=True)
    user_id = Column(String, index=True)
    problem_id = Column(String, index=True)
    language = Column(String)
    
    # Quality metrics
    quality_score = Column(Float)
    complexity_time = Column(String)
    complexity_space = Column(String)
    
    # Features
    features = Column(JSON)
#     {
#   "loop_depth": 3,
#   "uses_hashmap": false,
#   "cyclomatic_complexity": 14,
#   "recursion": true
# }   stores ML features here

    # Analysis results
    anti_patterns = Column(JSON)   #["nested_loops", "redundant_computation"]
    suggestions = Column(JSON)     #["Use hashing", "Avoid repeated sorting"]
    vulnerabilities = Column(JSON) #["stack_overflow_risk"]
    
    # Performance metrics
    runtime_ms = Column(Integer)
    memory_kb = Column(Integer)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PlagiarismCheck(Base):
    __tablename__ = "plagiarism_checks"
    
    id = Column(Integer, primary_key=True, index=True)
    contest_id = Column(String, index=True)
    submission_pairs = Column(JSON)
    similarity_scores = Column(JSON)
    suspicious_pairs = Column(JSON)
    checked_at = Column(DateTime, default=datetime.utcnow)

# Database engine and session
engine = create_async_engine(settings.DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

async def get_db() -> AsyncSession:
    """Get database session"""
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def close_db():
    """Close database connections"""
    await engine.dispose()