import Redis from 'ioredis';

// Initialize Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

// Test connection
redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

// ============ PROBLEM CACHING ============

export const cacheProblem = async (problemId, problemData, ttl = 3600) => {
  try {
    const key = `problem:${problemId}`;
    await redis.setex(key, ttl, JSON.stringify(problemData));
    console.log(`📦 Cached problem: ${problemId}`);
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
};

export const getCachedProblem = async (problemId) => {
  try {
    const key = `problem:${problemId}`;
    const cached = await redis.get(key);
    if (cached) {
      console.log(`✅ Cache HIT: ${problemId}`);
      return JSON.parse(cached);
    }
    console.log(`❌ Cache MISS: ${problemId}`);
    return null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

export const invalidateProblem = async (problemId) => {
  try {
    const key = `problem:${problemId}`;
    await redis.del(key);
    console.log(`🗑️ Cache invalidated: ${problemId}`);
    return true;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return false;
  }
};

// ============ LEADERBOARD ============

export const updateLeaderboard = async (userId, score, leaderboardType = 'global') => {
  try {
    const key = `leaderboard:${leaderboardType}`;
    await redis.zadd(key, score, userId);
    console.log(`📊 Updated leaderboard: ${userId} - ${score}`);
    return true;
  } catch (error) {
    console.error('Leaderboard update error:', error);
    return false;
  }
};

export const getLeaderboard = async (leaderboardType = 'global', start = 0, end = 9) => {
  try {
    const key = `leaderboard:${leaderboardType}`;
    // Get top users with scores (descending)
    const results = await redis.zrevrange(key, start, end, 'WITHSCORES');
    
    // Format results
    const leaderboard = [];
    for (let i = 0; i < results.length; i += 2) {
      leaderboard.push({
        userId: results[i],
        score: parseInt(results[i + 1]),
        rank: start + (i / 2) + 1
      });
    }
    
    console.log(`📊 Fetched leaderboard: ${leaderboard.length} entries`);
    return leaderboard;
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return [];
  }
};

export const getUserRank = async (userId, leaderboardType = 'global') => {
  try {
    const key = `leaderboard:${leaderboardType}`;
    const rank = await redis.zrevrank(key, userId);
    if (rank !== null) {
      return rank + 1; // Ranks are 0-indexed
    }
    return null;
  } catch (error) {
    console.error('User rank fetch error:', error);
    return null;
  }
};

// ============ RATE LIMITING ============

export const checkRateLimit = async (key, limit = 20, windowSeconds = 60) => {
  try {
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    
    if (current > limit) {
      const ttl = await redis.ttl(key);
      throw new Error(`Rate limit exceeded. Try again in ${ttl} seconds.`);
    }
    
    return {
      allowed: true,
      remaining: limit - current
    };
  } catch (error) {
    throw error;
  }
};

// ============ SESSION MANAGEMENT ============

export const setSession = async (sessionId, userData, ttl = 86400) => {
  try {
    const key = `session:${sessionId}`;
    await redis.setex(key, ttl, JSON.stringify(userData));
    return true;
  } catch (error) {
    console.error('Session set error:', error);
    return false;
  }
};

export const getSession = async (sessionId) => {
  try {
    const key = `session:${sessionId}`;
    const session = await redis.get(key);
    return session ? JSON.parse(session) : null;
  } catch (error) {
    console.error('Session get error:', error);
    return null;
  }
};

export const deleteSession = async (sessionId) => {
  try {
    const key = `session:${sessionId}`;
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Session delete error:', error);
    return false;
  }
};

// ============ SUBMISSION RESULTS CACHE ============

export const cacheSubmissionResult = async (submissionId, result, ttl = 3600) => {
  try {
    const key = `submission:${submissionId}`;
    await redis.setex(key, ttl, JSON.stringify(result));
    return true;
  } catch (error) {
    console.error('Submission cache error:', error);
    return false;
  }
};

export const getCachedSubmissionResult = async (submissionId) => {
  try {
    const key = `submission:${submissionId}`;
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Submission cache get error:', error);
    return null;
  }
};

// ============ PROBLEM LIST CACHE ============

export const cacheProblemsPage = async (pageKey, problemsData, ttl = 600) => {
  try {
    const key = `problems:page:${pageKey}`;
    await redis.setex(key, ttl, JSON.stringify(problemsData));
    return true;
  } catch (error) {
    console.error('Problems page cache error:', error);
    return false;
  }
};

export const getCachedProblemsPage = async (pageKey) => {
  try {
    const key = `problems:page:${pageKey}`;
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    return null;
  }
};

// ============ CLEANUP ============

export const clearAllCache = async () => {
  try {
    await redis.flushall();
    console.log('🗑️ All cache cleared');
    return true;
  } catch (error) {
    console.error('Cache clear error:', error);
    return false;
  }
};

export default redis;