import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

/**
 * Rate Limiter Utilities
 * Provides various rate limiting strategies for different endpoints
 */

// Redis client for distributed rate limiting (optional)
let redisClient = null;

/**
 * Initialize Redis client for rate limiting
 * Only used if Redis is configured
 */
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

// Initialize Redis on module load
initializeRedis();

/**
 * Create rate limiter configuration
 * @param {Object} options - Rate limiter options
 * @returns {Object} - Rate limiter middleware
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max requests per window
    message: {
      success: false,
      message: 'Too many requests, please try again later.',
      retryAfter: null
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: options.message?.message || 'Too many requests, please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    },
    skip: (req) => {
      // Skip rate limiting for admin users in development
      if (process.env.NODE_ENV === 'development' && req.user?.role === 'admin') {
        return true;
      }
      return false;
    },
    ...options
  };

  // Use Redis store if available, otherwise use memory store
  if (redisClient && redisClient.isOpen) {
    defaultOptions.store = new RedisStore({
      client: redisClient,
      prefix: 'rl:', // Rate limit prefix
    });
  }

  return rateLimit(defaultOptions);
};

/**
 * Global rate limiter for all routes
 * Moderate limits for general API usage
 */
export const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    message: 'Too many requests from this IP, please try again later.'
  }
});

/**
 * Strict rate limiter for authentication routes
 * Prevents brute force attacks
 */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 failed login attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    message: 'Too many authentication attempts, please try again later.'
  }
});

/**
 * Rate limiter for registration
 * Prevents spam account creation
 */
export const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 registrations per hour per IP
  message: {
    message: 'Too many accounts created from this IP, please try again later.'
  }
});

/**
 * Rate limiter for code submission
 * Prevents submission spam
 */
export const submissionLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 submissions per minute
  message: {
    message: 'Too many submissions, please slow down and try again.'
  }
});

/**
 * Rate limiter for code execution/testing
 * More lenient than submission
 */
export const executionLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 code runs per minute
  message: {
    message: 'Too many code executions, please wait a moment.'
  }
});

/**
 * Rate limiter for password reset requests
 * Prevents abuse of password reset
 */
export const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  message: {
    message: 'Too many password reset requests, please try again later.'
  }
});

/**
 * Rate limiter for email sending
 * Prevents email spam
 */
export const emailLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 emails per hour per user
  message: {
    message: 'Too many emails sent, please try again later.'
  }
});

/**
 * Rate limiter for API key requests
 * Protects API key generation
 */
export const apiKeyLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 API key requests per day
  message: {
    message: 'Too many API key requests, please try again tomorrow.'
  }
});

/**
 * Rate limiter for file uploads
 * Prevents upload spam
 */
export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    message: 'Too many file uploads, please try again later.'
  }
});

/**
 * Rate limiter for search queries
 * Prevents search abuse
 */
export const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: {
    message: 'Too many search requests, please slow down.'
  }
});

/**
 * Lenient rate limiter for read-only operations
 * Higher limits for GET requests
 */
export const readLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes
  message: {
    message: 'Too many requests, please try again later.'
  }
});

/**
 * Strict rate limiter for write operations
 * Lower limits for POST/PUT/DELETE requests
 */
export const writeLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per 15 minutes
  message: {
    message: 'Too many write operations, please try again later.'
  }
});

/**
 * Contest submission rate limiter
 * Specific for contest submissions
 */
export const contestSubmissionLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 contest submissions per minute
  message: {
    message: 'Too many contest submissions, please wait before submitting again.'
  }
});

/**
 * Admin action rate limiter
 * Protects admin endpoints
 */
export const adminLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 admin actions per minute
  message: {
    message: 'Too many admin actions, please slow down.'
  }
});

/**
 * Close Redis connection
 * Should be called on server shutdown
 */
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

/**
 * Get Redis client status
 * @returns {boolean} - True if Redis is connected
 */
export const isRedisConnected = () => {
  return redisClient && redisClient.isOpen;
};

// Export custom rate limiter creator
export { createRateLimiter };

// Default export with all limiters
export default {
  globalLimiter,
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