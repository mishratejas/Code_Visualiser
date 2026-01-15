class ApiError extends Error {
    constructor(statusCode, message, errors = [], isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.timestamp = new Date().toISOString();
        
        Error.captureStackTrace(this, this.constructor);
    }
    
    // Factory methods for common errors
    static badRequest(message = 'Bad Request', errors = []) {
        return new ApiError(400, message, errors);
    }
    
    static unauthorized(message = 'Unauthorized', errors = []) {
        return new ApiError(401, message, errors);
    }
    
    static forbidden(message = 'Forbidden', errors = []) {
        return new ApiError(403, message, errors);
    }
    
    static notFound(message = 'Not Found', errors = []) {
        return new ApiError(404, message, errors);
    }
    
    static conflict(message = 'Conflict', errors = []) {
        return new ApiError(409, message, errors);
    }
    
    static validationError(message = 'Validation Error', errors = []) {
        return new ApiError(422, message, errors);
    }
    
    static internal(message = 'Internal Server Error', errors = []) {
        return new ApiError(500, message, errors);
    }
    
    static serviceUnavailable(message = 'Service Unavailable', errors = []) {
        return new ApiError(503, message, errors);
    }
    
    // Method to convert to JSON for response
    toJSON() {
        return {
            status: this.status,
            statusCode: this.statusCode,
            message: this.message,
            errors: this.errors,
            timestamp: this.timestamp,
            ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
        };
    }
}

export default ApiError;

//Explanation: Ye error handling ka standard format provide karta hai. 
// ApiError class extend karta hai Error class ko. 
// Isme factory methods hain jo common HTTP errors ke liye ready-made objects create karte hain. 
// toJSON() method response mein consistent format deta hai.