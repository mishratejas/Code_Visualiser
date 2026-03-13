import 'dotenv/config';
import { createServer } from 'http';
import { initializeSocket } from './src/socket/contestSocket.js';
import streakJobs from './src/jobs/streakJobs.js';
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
  
  // Auto-seed achievements if empty
  import('./src/models/achievement.models.js').then(async m => {
    try {
      const { Achievement } = m;
      const count = await Achievement.countDocuments();
      if (count === 0) {
        await Achievement.insertMany([
          { key:'first_solve',   title:'First Steps',      description:'Solve your first problem',           icon:'🎯', category:'milestone', points:10,   requirement:1,   type:'count',  color:'from-green-500 to-emerald-500', isActive:true },
          { key:'problem_10',    title:'Getting Started',  description:'Solve 10 problems',                  icon:'📚', category:'milestone', points:50,   requirement:10,  type:'count',  color:'from-blue-500 to-cyan-500', isActive:true },
          { key:'problem_50',    title:'Problem Solver',   description:'Solve 50 problems',                  icon:'🏅', category:'milestone', points:200,  requirement:50,  type:'count',  color:'from-purple-500 to-pink-500', isActive:true },
          { key:'problem_100',   title:'Century',          description:'Solve 100 problems',                 icon:'💯', category:'milestone', points:500,  requirement:100, type:'count',  color:'from-yellow-500 to-orange-500', isActive:true },
          { key:'streak_7',      title:'Week Warrior',     description:'Maintain a 7-day streak',            icon:'🔥', category:'streak',    points:100,  requirement:7,   type:'streak', color:'from-orange-500 to-red-500', isActive:true },
          { key:'streak_30',     title:'Monthly Momentum', description:'Maintain a 30-day streak',           icon:'⚡', category:'streak',    points:300,  requirement:30,  type:'streak', color:'from-red-500 to-pink-500', isActive:true },
          { key:'streak_100',    title:'Unstoppable',      description:'Maintain a 100-day streak',          icon:'🌟', category:'streak',    points:1000, requirement:100, type:'streak', color:'from-purple-500 to-indigo-500', isActive:true },
          { key:'first_contest', title:'Contest Debut',    description:'Participate in your first contest',  icon:'🏆', category:'contest',   points:50,   requirement:1,   type:'count',  color:'from-yellow-500 to-amber-500', isActive:true },
          { key:'contest_10',    title:'Contest Regular',  description:'Participate in 10 contests',         icon:'🎖️',category:'contest',   points:200,  requirement:10,  type:'count',  color:'from-indigo-500 to-purple-500', isActive:true },
          { key:'contest_winner',title:'Champion',         description:'Win your first contest',             icon:'👑', category:'contest',   points:500,  requirement:1,   type:'unique', color:'from-yellow-400 to-yellow-600', isActive:true },
          { key:'speed_demon',   title:'Speed Demon',      description:'Solve a problem in under 60 seconds',icon:'⚡', category:'speed',     points:150,  requirement:1,   type:'unique', color:'from-cyan-500 to-blue-500', isActive:true },
          { key:'perfect_score', title:'Perfectionist',    description:'Get 100% score in a contest',        icon:'💎', category:'special',   points:500,  requirement:1,   type:'unique', color:'from-pink-500 to-rose-500', isActive:true },
        ]);
        console.log('✅ Achievements auto-seeded (12 achievements)');
      }
    } catch(e) { console.warn('Achievement seed skipped:', e.message); }
  }).catch(() => {});

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

streakJobs.start();

// On shutdown
process.on('SIGTERM', () => {
  streakJobs.stop();
});