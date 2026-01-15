import 'dotenv/config';
import dbManager from './db/index.js';
import App from './app.js';
import config from './config/index.js';
import logger from './config/logger.js';

// Handle uncaught exceptions (should be at the top)
process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    logger.error(err.name, err.message);
    process.exit(1);
});

// Connect to all databases
const connectDatabases = async () => {
    try {
        await dbManager.connectAll();
        logger.info('✅ All database connections established');
    } catch (error) {
        logger.error('❌ Database connection failed:', error.message);
        
        // In development, continue without databases
        if (config.server.isDevelopment) {
            logger.warn('⚠️ Running in development mode without databases');
        } else {
            process.exit(1);
        }
    }
};

// Create Express app instance
const app = new App();

// Start server
const startServer = async () => {
    try {
        // Connect to databases first
        await connectDatabases();
        
        // Start the server
        const server = app.start();
        
        // Handle server errors
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`Port ${config.server.port} is already in use`);
                process.exit(1);
            } else {
                logger.error('Server error:', error);
            }
        });
        
        // Graceful shutdown
        const gracefulShutdown = async () => {
            logger.info('🔌 SIGTERM received, shutting down gracefully');
            
            server.close(async () => {
                await dbManager.disconnectAll();
                logger.info('✅ Server shut down gracefully');
                process.exit(0);
            });
            
            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger.error('⏰ Forcing shutdown after timeout');
                process.exit(1);
            }, 10000);
        };
        
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
        
        return server;
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the application
startServer();

// Export for testing
export { app };