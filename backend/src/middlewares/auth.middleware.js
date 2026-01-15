import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/user.models.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  // Get token from Authorization header or cookie
  let token;
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }
  
  if (!token) {
    throw ApiError.unauthorized('Authentication required. Please login.');
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database (excluding password)
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      throw ApiError.unauthorized('User no longer exists');
    }
    
    // Check if user is active
    if (!user.isActive) {
      throw ApiError.forbidden('Account is deactivated');
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw ApiError.unauthorized('Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token expired');
    }
    throw error;
  }
});

// Authorization middleware
// Checks if user has required role(s)
// @param {...String} roles - Required roles

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('Insufficient permissions');
    }
    
    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user if token exists, but doesn't require it
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Token is invalid but we don't throw error for optional auth
      console.log('Optional auth token error:', error.message);
    }
  }
  
  next();
});