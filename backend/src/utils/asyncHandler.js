/**
 * Wrapper function to handle async route handlers
 * Eliminates try-catch blocks in controllers
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        // Convert returned value to Promise if it isn't already
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Advanced async handler with options
 * @param {Function} fn - Async function to wrap
 * @param {Object} options - Configuration options
 * @param {Boolean} options.logError - Whether to log errors
 * @param {Function} options.errorHandler - Custom error handler
 */
const asyncHandlerAdvanced = (fn, options = {}) => {
    const { 
        logError = true, 
        errorHandler = null 
    } = options;
    
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (error) {
            // Log error if enabled
            if (logError && process.env.NODE_ENV !== 'test') {
                console.error('Async Handler Error:', {
                    path: req.path,
                    method: req.method,
                    error: error.message,
                    stack: error.stack
                });
            }
            
            // Use custom error handler if provided
            if (errorHandler) {
                return errorHandler(error, req, res, next);
            }
            
            next(error);
        }
    };
};

/**
 * Async handler for background tasks (doesn't send response)
 */
const asyncTaskHandler = (fn) => {
    return async (...args) => {
        try {
            await fn(...args);
        } catch (error) {
            console.error('Background task failed:', error);
            // Don't throw, just log for background tasks
        }
    };
};

export { asyncHandler as default, asyncHandlerAdvanced, asyncTaskHandler };

//Ye wrapper hai jo async functions ko handle karta hai.
//  Yeh automatically errors ko catch karke next() mein pass karta hai,
//  jisse humein har controller mein try-catch nahi likhna padta.