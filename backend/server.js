import 'dotenv/config';
import { createServer } from 'http';
import { initializeSocket } from './src/socket/contestSocket.js';

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

import App from './src/app.js';
import dbManager from './src/db/index.js';

// Connect to all databases
dbManager.connectAll().then(() => {
  console.log('✅ All database connections established');
  
  // CREATE AN INSTANCE OF THE APP CLASS
  const appInstance = new App();
  
  // Get the port
  const PORT = process.env.PORT || 5000;
  
  // DON'T call appInstance.start() - it would listen on the port
  // Instead, just get the Express app and wrap it with HTTP server for Socket.IO
  
  // Create HTTP server with Express app
  const httpServer = createServer(appInstance.app);
  
  // Initialize Socket.IO on the HTTP server
  initializeSocket(httpServer);
  
  // NOW listen (only once!)
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err.message);
    console.error(err.stack);
    
    // Close server & exit process
    httpServer.close(async () => {
      await dbManager.disconnectAll();
      console.log('Server closed due to unhandled rejection');
      process.exit(1);
    });
  });

  // Graceful shutdown
  const gracefulShutdown = () => {
    console.log('Received shutdown signal, closing server...');
    
    httpServer.close(async () => {
      await dbManager.disconnectAll();
      console.log('Server closed gracefully');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('Force shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});