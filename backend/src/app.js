import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';

import config from './config/index.js';
import logger, { morganStream, requestLogger } from './config/logger.js';
import errorMiddleware from './middlewares/error.middleware.js';
import { globalLimiter } from './middlewares/rateLimiter.middleware.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import problemRoutes from './routes/problem.routes.js';
import submissionRoutes from './routes/submission.routes.js';
import userRoutes from './routes/user.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import contestRoutes from './routes/contest.routes.js';
import aiRoutes from './routes/ai.routes.js'; // ✅ AI ROUTES

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
            origin: config.security.corsOrigins || ['http://localhost:3000', 'http://localhost:5173'],
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
        this.app.use((req, res, next) => {
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
            
            if (req.body) {
                req.body = sanitizeData(req.body);
            }
            
            if (req.query && typeof req.query === 'object') {
                const sanitizedQuery = sanitizeData(req.query);
                Object.keys(sanitizedQuery).forEach(key => {
                    if (sanitizedQuery[key] !== undefined) {
                        req.query[key] = sanitizedQuery[key];
                    }
                });
            }
            
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
                    `${apiPrefix}/leaderboard`,
                    `${apiPrefix}/ai` // ✅ AI routes
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
                    },
                    ai: {
                        analyzeSubmission: `POST ${apiPrefix}/ai/submissions/:id/analyze`,
                        analyzeCode: `POST ${apiPrefix}/ai/analyze/code`,
                        recommendations: `GET ${apiPrefix}/ai/recommendations`,
                        skillGap: `GET ${apiPrefix}/ai/skill-gap`,
                        startInterview: `POST ${apiPrefix}/ai/interview/start`,
                        checkPlagiarism: `POST ${apiPrefix}/ai/plagiarism/check`
                    }
                }
            });
        });
        
        // ============================================
        // API ROUTES WITH VERSION PREFIX
        // ============================================
        
        this.app.use(`${apiPrefix}/auth`, authRoutes);
        this.app.use(`${apiPrefix}/contests`, contestRoutes);
        this.app.use(`${apiPrefix}/problems`, problemRoutes);
        this.app.use(`${apiPrefix}/submissions`, submissionRoutes);
        this.app.use(`${apiPrefix}/users`, userRoutes);
        this.app.use(`${apiPrefix}/leaderboard`, leaderboardRoutes);
        this.app.use(`${apiPrefix}/ai`, aiRoutes); // ✅ AI ROUTES
        
        // For backward compatibility, also register routes without version
        this.app.use(`${apiBase}/auth`, authRoutes);
        this.app.use(`${apiBase}/ai`, aiRoutes); // ✅ AI ROUTES (no version)
        
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
                    ai: `${apiPrefix}/ai`, // ✅ AI endpoint
                    health: `${apiPrefix}/health`,
                    docs: `${apiPrefix}/docs`
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
        if (config.features?.enableHealthChecks !== false) {
            setInterval(async () => {
                try {
                    const mongoose = (await import('mongoose')).default;
                    const mongoState = mongoose.connection.readyState;
                    
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
            }, 60000);
        }
    }
    
    start(port) {
        const serverPort = port || config.server.port || 5000;
        
        this.server = this.app.listen(serverPort, () => {
            logger.info(`🚀 Server running on port ${serverPort}`);
            logger.info(`📝 API Docs: http://localhost:${serverPort}/api/v1/docs`);
            logger.info(`🤖 AI Service: http://localhost:${serverPort}/api/v1/ai`);
        });
        
        // Graceful shutdown
        const gracefulShutdown = () => {
            logger.info('🛑 Received shutdown signal, gracefully closing...');
            
            this.server.close(() => {
                logger.info('✅ Server closed');
                process.exit(0);
            });
            
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