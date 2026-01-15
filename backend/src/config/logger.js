import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
import fs from 'fs';
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'coding-judge' },
    transports: [
        // Write all logs with level `error` and below to `error.log`
        new winston.transports.File({ 
            filename: path.join(logsDir, 'error.log'), 
            level: 'error' 
        }),
        // Write all logs to `combined.log`
        new winston.transports.File({ 
            filename: path.join(logsDir, 'combined.log') 
        }),
    ],
});

// If we're not in production, also log to console
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Morgan stream for HTTP logging
export const morganStream = {
    write: (message) => {
        logger.info(message.trim());
    },
};

// Request logger middleware
export const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.http({
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
        });
    });
    
    next();
};

export default logger;