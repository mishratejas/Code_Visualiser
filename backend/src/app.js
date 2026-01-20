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
import contestRoutes from './routes/contest.routes.js'; // ADD THIS LINE

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
            origin: config.security.corsOrigins || ['http://localhost:3000', 'http://localhost:5173'], // Added Vite default port
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
        
        // Sanitization - Fixed version
        this.app.use((req, res, next) => {
            // Helper function to sanitize data
            const sanitizeData = (data) => {
                if (!data || typeof data !== 'object') return data;
                
                const sanitized = Array.isArray(data) ? [] : {};
                
                for (const key in data) {
                    if (Object.prototype.hasOwnProperty.call(data, key)) {
                        const cleanKey = key.replace(/^\$/, '').replace(/\./g, '_');
                        const value = data[key];
                        
                        if (typeof value === 'string') {
                            sanitized[cleanKey] = value;
                        } else if (value && typeof value === 'object') {
                            sanitized[cleanKey] = sanitizeData(value);
                        } else {
                            sanitized[cleanKey] = value;
                        }
                    }
                }
                return sanitized;
            };
            
            // Sanitize body - this is allowed
            if (req.body) {
                req.body = sanitizeData(req.body);
            }
            
            // For query params, we need to be careful
            // Don't assign directly to req.query, just sanitize its properties
            if (req.query && typeof req.query === 'object') {
                const sanitizedQuery = sanitizeData(req.query);
                // Copy sanitized properties back to req.query
                Object.keys(sanitizedQuery).forEach(key => {
                    if (sanitizedQuery[key] !== undefined) {
                        req.query[key] = sanitizedQuery[key];
                    }
                });
            }
            
            // Sanitize params
            if (req.params && typeof req.params === 'object') {
                const sanitizedParams = sanitizeData(req.params);
                Object.keys(sanitizedParams).forEach(key => {
                    if (sanitizedParams[key] !== undefined) {
                        req.params[key] = sanitizedParams[key];
                    }
                });
            }
            
            next();
        });
        
        // HPP (HTTP Parameter Pollution) - Comment this out temporarily
        // this.app.use(hpp());
        // this.app.use(sanitizeInput);
        
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
        // Get the base path
        const apiBase = config.server.apiPrefix || '/api';
        const apiVersion = config.server.apiVersion || 'v1';
        const apiPrefix = `${apiBase}/${apiVersion}`;
        
        
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
                version: process.env.npm_package_version || '1.0.0',
                routes: [
                    `${apiPrefix}/auth`,
                    `${apiPrefix}/contests`,
                    `${apiPrefix}/problems`,
                    `${apiPrefix}/submissions`,
                    `${apiPrefix}/users`,
                    `${apiPrefix}/leaderboard`
                ]
            });
        });
        
        // API Documentation
        this.app.get(`${apiPrefix}/docs`, (req, res) => {
            res.json({
                message: 'Coding Judge API Documentation',
                version: '1.0.0',
                endpoints: {
                    auth: {
                        register: `POST ${apiPrefix}/auth/register`,
                        login: `POST ${apiPrefix}/auth/login`,
                        logout: `POST ${apiPrefix}/auth/logout`,
                        me: `GET ${apiPrefix}/auth/me`
                    },
                    contests: {
                        list: `GET ${apiPrefix}/contests`,
                        get: `GET ${apiPrefix}/contests/:id`,
                        create: `POST ${apiPrefix}/contests`,
                        update: `PUT ${apiPrefix}/contests/:id`,
                        delete: `DELETE ${apiPrefix}/contests/:id`,
                        register: `POST ${apiPrefix}/contests/:id/register`
                    },
                    problems: {
                        list: `GET ${apiPrefix}/problems`,
                        get: `GET ${apiPrefix}/problems/:id`,
                        create: `POST ${apiPrefix}/problems`,
                        update: `PUT ${apiPrefix}/problems/:id`,
                        delete: `DELETE ${apiPrefix}/problems/:id`
                    },
                    submissions: {
                        list: `GET ${apiPrefix}/submissions`,
                        get: `GET ${apiPrefix}/submissions/:id`,
                        create: `POST ${apiPrefix}/submissions`
                    },
                    users: {
                        profile: `GET ${apiPrefix}/users/:username`,
                        update: `PUT ${apiPrefix}/users/profile`
                    },
                    leaderboard: {
                        global: `GET ${apiPrefix}/leaderboard`,
                        contest: `GET ${apiPrefix}/contests/:id/leaderboard`
                    }
                }
            });
        });
        
        // API routes with version prefix
        this.app.use(`${apiPrefix}/auth`, authRoutes);
        
        this.app.use(`${apiPrefix}/contests`, contestRoutes);
        
        this.app.use(`${apiPrefix}/problems`, problemRoutes);
        
        this.app.use(`${apiPrefix}/submissions`, submissionRoutes);
        
        this.app.use(`${apiPrefix}/users`, userRoutes);
        
        this.app.use(`${apiPrefix}/leaderboard`, leaderboardRoutes);
        
        // For backward compatibility, also register routes without version
        this.app.use(`${apiBase}/auth`, authRoutes);
        
        // Test endpoint to verify all routes
        this.app.get(`${apiPrefix}/routes`, (req, res) => {
            const routes = [];
            this.app._router.stack.forEach((middleware) => {
                if (middleware.route) {
                    routes.push({
                        path: middleware.route.path,
                        methods: Object.keys(middleware.route.methods)
                    });
                } else if (middleware.name === 'router') {
                    // Handle mounted routers
                    middleware.handle.stack.forEach((handler) => {
                        if (handler.route) {
                            routes.push({
                                path: handler.route.path,
                                methods: Object.keys(handler.route.methods)
                            });
                        }
                    });
                }
            });
            res.json({ routes });
        });
        
        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                message: 'Coding Judge API',
                version: '1.0.0',
                apiBase: apiBase,
                apiVersion: apiVersion,
                apiPrefix: apiPrefix,
                endpoints: {
                    auth: `${apiPrefix}/auth`,
                    contests: `${apiPrefix}/contests`,
                    problems: `${apiPrefix}/problems`,
                    submissions: `${apiPrefix}/submissions`,
                    users: `${apiPrefix}/users`,
                    leaderboard: `${apiPrefix}/leaderboard`,
                    health: `${apiPrefix}/health`,
                    docs: `${apiPrefix}/docs`
                }
            });
        });
        
        // REMOVED THE PROBLEMATIC 404 HANDLERS
        
        // Error handling will handle 404s in the error middleware
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
                    // Check MongoDB
                    const mongoose = (await import('mongoose')).default;
                    const mongoState = mongoose.connection.readyState;
                    const mongoStates = {
                        0: 'disconnected',
                        1: 'connected',
                        2: 'connecting',
                        3: 'disconnecting'
                    };
                    
                    // Check PostgreSQL if enabled
                    let postgresState = 'not configured';
                    if (process.env.POSTGRES_URI) {
                        try {
                            const { sequelize } = await import('./db/postgres/index.js');
                            await sequelize.authenticate();
                            postgresState = 'connected';
                        } catch (pgError) {
                            postgresState = 'disconnected';
                            logger.warn('PostgreSQL health check failed:', pgError.message);
                        }
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