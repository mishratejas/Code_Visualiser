import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

import config from './config/index.js';
import logger, { morganStream, requestLogger } from './config/logger.js';
import errorMiddleware from './middlewares/error.middleware.js';
import { globalLimiter } from './middlewares/rateLimiter.middleware.js';
import { sanitizeInput } from './middlewares/validate.middleware.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import problemRoutes from './routes/problem.routes.js';
import submissionRoutes from './routes/submission.routes.js';
import userRoutes from './routes/user.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';

class App {
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
        this.setupHealthChecks();
    }
    
    setupMiddleware() {
        // Trust proxy
        this.app.set('trust proxy', 1);
        
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                },
            },
            crossOriginEmbedderPolicy: false,
        }));
        
        // CORS configuration
        this.app.use(cors({
            origin: config.security.corsOrigins || ['http://localhost:3000'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            exposedHeaders: ['X-Total-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining']
        }));
        
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use(cookieParser());
        
        // Compression
        this.app.use(compression());
        
        // Sanitization
        this.app.use(mongoSanitize());
        this.app.use(hpp());
        this.app.use(sanitizeInput);
        
        // Logging
        if (config.server.isDevelopment) {
            this.app.use(morgan('dev', { stream: morganStream }));
        } else {
            this.app.use(morgan('combined', { stream: morganStream }));
        }
        this.app.use(requestLogger);
        
        // Rate limiting
        if (config.features?.enableRateLimiting !== false) {
            this.app.use(globalLimiter);
        }
        
        // Request timing
        this.app.use((req, res, next) => {
            req.startTime = Date.now();
            next();
        });
    }
    
    setupRoutes() {
        // API prefix
        const apiPrefix = `${config.server.apiPrefix || '/api'}/${config.server.apiVersion || 'v1'}`;
        
        // Health check endpoint
        this.app.get(`${apiPrefix}/health`, (req, res) => {
            const uptime = process.uptime();
            const memoryUsage = process.memoryUsage();
            
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
                memory: {
                    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
                    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                },
                environment: config.server.nodeEnv,
                version: process.env.npm_package_version || '1.0.0'
            });
        });
        
        // API Documentation
        this.app.get(`${apiPrefix}/docs`, (req, res) => {
            res.json({
                message: 'Coding Judge API Documentation',
                version: '1.0.0',
                endpoints: {
                    auth: {
                        register: 'POST /auth/register',
                        login: 'POST /auth/login',
                        logout: 'POST /auth/logout',
                        me: 'GET /auth/me'
                    },
                    problems: {
                        list: 'GET /problems',
                        get: 'GET /problems/:id',
                        create: 'POST /problems (admin)',
                        update: 'PUT /problems/:id (admin)'
                    },
                    submissions: {
                        submit: 'POST /submissions',
                        list: 'GET /submissions',
                        get: 'GET /submissions/:id'
                    },
                    users: {
                        profile: 'GET /users/:username',
                        stats: 'GET /users/:username/stats'
                    },
                    leaderboard: 'GET /leaderboard'
                }
            });
        });
        
        // API routes
        this.app.use(`${apiPrefix}/auth`, authRoutes);
        this.app.use(`${apiPrefix}/problems`, problemRoutes);
        this.app.use(`${apiPrefix}/submissions`, submissionRoutes);
        this.app.use(`${apiPrefix}/users`, userRoutes);
        this.app.use(`${apiPrefix}/leaderboard`, leaderboardRoutes);
        
        // 404 handler for undefined routes
        this.app.use(`${apiPrefix}/:params`, (req, res, next) => {
            const err = new Error(`Cannot ${req.method} ${req.originalUrl}`);
            err.statusCode = 404;
            err.isOperational = true;
            next(err);
        });
        
        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                message: 'Coding Judge API',
                version: '1.0.0',
                documentation: `${req.protocol}://${req.get('host')}${apiPrefix}/docs`,
                endpoints: {
                    auth: `${apiPrefix}/auth`,
                    problems: `${apiPrefix}/problems`,
                    submissions: `${apiPrefix}/submissions`,
                    users: `${apiPrefix}/users`,
                    leaderboard: `${apiPrefix}/leaderboard`
                }
            });
        });
    }
    
    setupErrorHandling() {
        // Error handling middleware (should be last)
        this.app.use(errorMiddleware);
        
        // Unhandled promise rejection handler
        process.on('unhandledRejection', (err) => {
            logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
            logger.error(err.name, err.message);
            
            // Graceful shutdown in production
            if (config.server.isProduction) {
                if (this.server) {
                    this.server.close(() => {
                        process.exit(1);
                    });
                } else {
                    process.exit(1);
                }
            } else {
                process.exit(1);
            }
        });
        
        // Uncaught exception handler
        process.on('uncaughtException', (err) => {
            logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
            logger.error(err.name, err.message, err.stack);
            process.exit(1);
        });
    }
    
    setupHealthChecks() {
        // Database health check
        if (config.features?.enableHealthChecks !== false) {
            setInterval(async () => {
                try {
                    const mongoose = (await import('mongoose')).default;
                    const state = mongoose.connection.readyState;
                    
                    const states = {
                        0: 'disconnected',
                        1: 'connected',
                        2: 'connecting',
                        3: 'disconnecting'
                    };
                    
                    logger.debug(`MongoDB health: ${states[state]}`);
                    
                    if (state !== 1) {
                        logger.warn('MongoDB connection issue detected');
                    }
                } catch (error) {
                    logger.error('Health check failed:', error.message);
                }
            }, 60000); // Check every minute
        }
    }
    
    start(port) {
        const serverPort = port || config.server.port || 5000;
        
        this.server = this.app.listen(serverPort, () => {
            logger.info(`🚀 Server running in ${config.server.nodeEnv} mode on port ${serverPort}`);
            logger.info(`📚 API Documentation: http://localhost:${serverPort}/api/v1/docs`);
            logger.info(`🏥 Health check: http://localhost:${serverPort}/api/v1/health`);
        });
        
        // Graceful shutdown
        const gracefulShutdown = () => {
            logger.info('🛑 Received shutdown signal, gracefully closing...');
            
            this.server.close(() => {
                logger.info('✅ Server closed');
                process.exit(0);
            });
            
            // Force close after 10 seconds
            setTimeout(() => {
                logger.error('⏰ Forcing shutdown after timeout');
                process.exit(1);
            }, 10000);
        };
        
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
        
        return this.server;
    }
}

export default App;