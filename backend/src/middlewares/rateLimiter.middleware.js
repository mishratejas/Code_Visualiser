import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

/**
 * Rate Limiter Utilities - FIXED VERSION
 * More lenient limits for contest pages with multiple API calls
 */

let redisClient = null;

const initializeRedis = async () => {
  if (process.env.REDIS_URI && !redisClient) {
    try {
      redisClient = createClient({
        url: process.env.REDIS_URI,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              console.log('Redis reconnection failed. Using memory store for rate limiting.');
              return new Error('Max retries reached');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      await redisClient.connect();
      console.log('✅ Redis connected for rate limiting');
    } catch (error) {
      console.error('Failed to initialize Redis for rate limiting:', error);
      redisClient = null;
    }
  }
};

initializeRedis();

const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      success: false,
      message: 'Too many requests, please try again later.',
      retryAfter: null
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: options.message?.message || 'Too many requests, please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    },
    skip: (req) => {
      // ✅ FIX: Skip rate limiting in development
      if (process.env.NODE_ENV === 'development') {
        return true;
      }
      
      // Skip for admin users
      if (req.user?.role === 'admin') {
        return true;
      }
      return false;
    },
    ...options
  };

  if (redisClient && redisClient.isOpen) {
    defaultOptions.store = new RedisStore({
      client: redisClient,
      prefix: 'rl:',
    });
  }

  return rateLimit(defaultOptions);
};

/**
 * ✅ FIX: Much more lenient global limiter for contest pages
 * Contest pages make multiple rapid API calls (leaderboard, problems, submissions)
 */
export const globalLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 500, // 500 requests per minute (was 100 per 15 min)
  message: {
    message: 'Too many requests from this IP, please try again later.'
  }
});

/**
 * ✅ IMPORTANT: For contest-related endpoints, use a very lenient limiter
 */
export const contestLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // Allow many requests for real-time updates
  message: {
    message: 'Too many contest requests, please slow down.'
  }
});

// Keep auth strict for security
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    message: 'Too many authentication attempts, please try again later.'
  }
});

export const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    message: 'Too many accounts created from this IP, please try again later.'
  }
});

// More lenient submission limiter
export const submissionLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20, // Increased from 10
  message: {
    message: 'Too many submissions, please slow down and try again.'
  }
});

export const executionLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30, // Increased from 20
  message: {
    message: 'Too many code executions, please wait a moment.'
  }
});

export const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    message: 'Too many password reset requests, please try again later.'
  }
});

export const emailLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    message: 'Too many emails sent, please try again later.'
  }
});

export const apiKeyLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  message: {
    message: 'Too many API key requests, please try again tomorrow.'
  }
});

export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    message: 'Too many file uploads, please try again later.'
  }
});

export const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 50, // Increased from 30
  message: {
    message: 'Too many search requests, please slow down.'
  }
});

/**
 * ✅ FIX: Very lenient for read operations (especially for contest pages)
 */
export const readLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // Very high for GET requests
  message: {
    message: 'Too many requests, please try again later.'
  }
});

export const writeLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increased from 50
  message: {
    message: 'Too many write operations, please try again later.'
  }
});

export const contestSubmissionLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10, // Increased from 5
  message: {
    message: 'Too many contest submissions, please wait before submitting again.'
  }
});

export const adminLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100, // Increased from 50
  message: {
    message: 'Too many admin actions, please slow down.'
  }
});

export const closeRedisConnection = async () => {
  if (redisClient && redisClient.isOpen) {
    try {
      await redisClient.quit();
      console.log('✅ Redis connection closed for rate limiting');
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
  }
};

export const isRedisConnected = () => {
  return redisClient && redisClient.isOpen;
};

export { createRateLimiter };

export default {
  globalLimiter,
  contestLimiter, // ✅ NEW: Contest-specific limiter
  authLimiter,
  registerLimiter,
  submissionLimiter,
  executionLimiter,
  passwordResetLimiter,
  emailLimiter,
  apiKeyLimiter,
  uploadLimiter,
  searchLimiter,
  readLimiter,
  writeLimiter,
  contestSubmissionLimiter,
  adminLimiter,
  createRateLimiter,
  closeRedisConnection,
  isRedisConnected
};