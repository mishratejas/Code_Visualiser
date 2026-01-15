import rateLimit from 'express-rate-limit';
import ApiError from '../utils/ApiError.js';

// Global rate limiter - SIMPLIFIED WORKING VERSION
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes = 900,000ms
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// Submission rate limiter
export const submissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many submissions, please slow down.',
});