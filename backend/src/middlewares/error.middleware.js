import ApiError from '../utils/ApiError.js';
import { STATUS_CODES } from '../constants.js';

/**
 * Error handling middleware
 * Centralized error handling for all routes
 */
const errorMiddleware = (err, req, res, next) => {
  let error = err;
  
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('🔥 Error Stack:', err.stack);
    console.error('📝 Error Details:', {
      message: err.message,
      name: err.name,
      path: req.path,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query
    });
  }
  
  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(val => val.message);
    error = ApiError.badRequest('Validation failed', messages);
  }
  
  // Handle Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = ApiError.conflict(message);
  }
  
  // Handle Mongoose CastError (invalid ObjectId)
  if (error.name === 'CastError') {
    const message = `Invalid ${error.path}: ${error.value}`;
    error = ApiError.badRequest(message);
  }
  
  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid token');
  }
  
  if (error.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Token expired');
  }
  
  // If it's not an instance of ApiError, create a generic one
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message);
  }
  
  // Send error response
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors || [],
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });
};

export default errorMiddleware;