import 'dotenv/config';
import { createServer } from 'http';
import dbManager from './src/db/index.js';
import App from './src/app.js';
import { initializeSocket } from './src/socket/contestSocket.js';
import logger from './src/config/logger.js';

/**
 * ✅ FIXED: Proper server initialization with Socket.IO
 * 
 * Key fixes:
 * 1. Create HTTP server BEFORE calling app.start()
 * 2. Initialize Socket.IO on HTTP server
 * 3. Only listen on the port ONCE
 */

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

// Start the application
const startServer = async () => {
  try {
    // 1. Connect to databases
    console.log('🔌 Connecting to databases...');
    await dbManager.connectAll();
    console.log('✅ All database connections established');

    // 2. Create Express app instance
    console.log('⚙️ Creating Express app...');
    const appInstance = new App();
    
    // ✅ FIX: Get the Express app WITHOUT calling start()
    const expressApp = appInstance.app;

    // 3. Create HTTP server
    console.log('🌐 Creating HTTP server...');
    const httpServer = createServer(expressApp);

    // 4. Initialize Socket.IO
    console.log('🔌 Initializing Socket.IO...');
    initializeSocket(httpServer);

    // 5. Start listening (only once!)
    console.log(`🚀 Starting server on port ${PORT}...`);
    httpServer.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ Socket.IO ready for connections`);
    });

    // Handle server errors
    httpServer.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.error('Please try:');
        console.error('  1. Kill the process using that port');
        console.error('  2. Use a different port by setting PORT env variable');
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n🔌 ${signal} received, shutting down gracefully...`);
      
      // Close server (stops accepting new connections)
      httpServer.close(async () => {
        console.log('✅ HTTP server closed');
        
        try {
          // Disconnect from databases
          await dbManager.disconnectAll();
          console.log('✅ Database connections closed');
          
          // Exit process
          console.log('✅ Server shut down gracefully');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('⏰ Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('❌ UNHANDLED REJECTION! Shutting down...');
      console.error('Error:', err);
      
      httpServer.close(async () => {
        await dbManager.disconnectAll();
        console.log('Server closed due to unhandled rejection');
        process.exit(1);
      });
    });

    return httpServer;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();