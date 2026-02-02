import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/user.models.js';
import PostgresUser from '../models/postgres/User.models.js';

/**
 * Protect routes - Verify JWT token
 * This middleware checks for token in:
 * 1. Authorization header (Bearer token)
 * 2. Cookie
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header first
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Then check cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // If no token found
  if (!token) {
    throw ApiError.unauthorized('Not authorized to access this route. Please login.');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    // Get user from MongoDB (primary user store)
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      throw ApiError.unauthorized('User not found. Token is invalid.');
    }

    // Check if user is active
    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated.');
    }

    // ✅ FIX: Attach user to request with BOTH _id and id for compatibility
    req.user = {
      ...user.toObject(),
      id: user._id.toString(), // Add id field for PostgreSQL compatibility
      _id: user._id // Keep _id for MongoDB compatibility
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw ApiError.unauthorized('Invalid token. Please login again.');
    } else if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token expired. Please login again.');
    } else {
      throw error;
    }
  }
});

/**
 * Grant access to specific roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Not authorized to access this route');
    }

    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `User role '${req.user.role}' is not authorized to access this route`
      );
    }

    next();
  };
};

/**
 * Optional authentication - continues even if no token
 * Used for routes that have different behavior for logged-in users
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header first
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Then check cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // If no token, just continue without user
  if (!token) {
    return next();
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    // Get user from MongoDB
    const user = await User.findById(decoded.userId).select('-password');

    if (user && user.isActive) {
      // Attach user to request with both _id and id
      req.user = {
        ...user.toObject(),
        id: user._id.toString(),
        _id: user._id
      };
    }
  } catch (error) {
    // Ignore errors in optional auth
    console.log('Optional auth failed:', error.message);
  }

  next();
});

/**
 * Check if user owns the resource
 */
export const checkOwnership = (getResourceUserId) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Not authorized');
    }

    const resourceUserId = await getResourceUserId(req);

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    if (resourceUserId.toString() !== req.user._id.toString()) {
      throw ApiError.forbidden('You do not have permission to access this resource');
    }

    next();
  });
};

/**
 * Rate limiting for authentication routes
 */
export const authRateLimiter = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!attempts.has(identifier)) {
      attempts.set(identifier, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const userAttempts = attempts.get(identifier);

    if (now > userAttempts.resetTime) {
      // Reset window
      attempts.set(identifier, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userAttempts.count >= maxAttempts) {
      throw ApiError.tooManyRequests(
        `Too many attempts. Please try again in ${Math.ceil((userAttempts.resetTime - now) / 60000)} minutes.`
      );
    }

    userAttempts.count++;
    next();
  };
};

export default { authenticate, authorize, optionalAuth, checkOwnership, authRateLimiter };