import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
    // Server configuration
    server: {
        port: process.env.PORT || 5000,
        nodeEnv: process.env.NODE_ENV || 'development',
        isProduction: process.env.NODE_ENV === 'production',
        isDevelopment: process.env.NODE_ENV === 'development',
        clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
        apiVersion: process.env.API_VERSION || 'v1',
        apiPrefix: process.env.API_PREFIX || '/api',
    },
    
    // Email configuration (ADD THIS SECTION)
    email: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        from: process.env.EMAIL_FROM || 'noreply@codingjudge.com'
    },
    
    // Frontend configuration (ADD THIS SECTION)
    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:3000',
        passwordResetUrl: process.env.FRONTEND_URL 
            ? `${process.env.FRONTEND_URL}/reset-password` 
            : 'http://localhost:3000/reset-password'
    },
    
    // Rate limiting configuration
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000, // 15 minutes in ms
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 100,
        authWindow: 15 * 60 * 1000, // 15 minutes
        authMax: 5,
        submissionWindow: 60 * 1000, // 1 minute
        submissionMax: 10
    },
    
    // Security configuration
    security: {
        corsOrigins: process.env.CORS_ORIGINS 
            ? process.env.CORS_ORIGINS.split(',') 
            : ['http://localhost:3000'],
    },
    
    // Feature flags
    features: {
        enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
        enableHealthChecks: process.env.ENABLE_HEALTH_CHECKS !== 'false',
    }
};

export default config;