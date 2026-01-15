import 'dotenv/config';

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

import App from './src/app.js';  // This imports a CLASS
import dbManager from './src/db/index.js';

// Connect to all databases
dbManager.connectAll().then(() => {
  console.log('✅ All database connections established');
  
  // ✅ CREATE AN INSTANCE OF THE APP CLASS
  const appInstance = new App();
  
  // ✅ Use the start() method from your App class
  const server = appInstance.start(process.env.PORT || 5000);
  console.log(`Server running on port ${process.env.PORT || 5000}`);

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err.message);
    console.error(err.stack);
    
    // Close server & exit process
    server.close(() => {
      console.log('Server closed due to unhandled rejection');
      process.exit(1);
    });
  });

  // Graceful shutdown
  const gracefulShutdown = () => {
    console.log('Received shutdown signal, closing server...');
    server.close(async () => {
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