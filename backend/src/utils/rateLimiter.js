import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../config/redis.config.js';
import { RATE_LIMIT, RATE_LIMIT_MESSAGES } from '../constants.js';

/**
 * Create a rate limiter with Redis store
 */
export const createLimiter = (options = {}) => {
  const defaults = {
    windowMs: RATE_LIMIT.WINDOW_MS,
    max: RATE_LIMIT.MAX_REQUESTS,
    message: RATE_LIMIT_MESSAGES.TOO_MANY_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    // Use Redis if available
    ...(redis ? {
      store: new RedisStore({
        client: redis,
        prefix: 'rl:',
      })
    } : {})
  };

  return rateLimit({ ...defaults, ...options });
};

/**
 * Strict limiter for sensitive operations
 */
export const strictLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: RATE_LIMIT_MESSAGES.TOO_MANY_REQUESTS
});

/**
 * Auth limiter for login/register
 */
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: RATE_LIMIT_MESSAGES.AUTH_LIMIT_EXCEEDED
});

/**
 * Submission limiter
 */
export const submissionLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 submissions per minute
  message: RATE_LIMIT_MESSAGES.TOO_MANY_SUBMISSIONS
});

/**
 * AI service limiter (more restrictive)
 */
export const aiLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 AI requests per minute
  message: 'Too many AI requests, please slow down'
});

/**
 * API limiter (general)
 */
export const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: RATE_LIMIT_MESSAGES.TOO_MANY_REQUESTS
});

export default {
  createLimiter,
  strictLimiter,
  authLimiter,
  submissionLimiter,
  aiLimiter,
  apiLimiter
};