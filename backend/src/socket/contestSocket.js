import { Server } from 'socket.io';
import redis from '../config/redis.config.js';

let io;

/**
 * ✅ FIXED: Initialize Socket.IO with proper configuration
 */
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      // ✅ FIX: Allow all localhost ports in development
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:8080'
          ],
      credentials: true,
      methods: ['GET', 'POST']
    },
    // ✅ FIX: Add transport configuration
    transports: ['websocket', 'polling'],
    // ✅ FIX: Increase ping timeout to prevent premature disconnections
    pingTimeout: 60000,
    pingInterval: 25000,
    // ✅ FIX: Allow more connections
    maxHttpBufferSize: 1e8,
    // ✅ FIX: Connection state recovery
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    }
  });

  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    // ✅ FIX: Handle connection errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Join contest room
    socket.on('join_contest', async ({ contestId, userId }) => {
      try {
        const room = `contest_${contestId}`;
        socket.join(room);
        console.log(`✅ User ${userId} joined contest ${contestId}`);
        
        // Send current leaderboard
        const leaderboard = await getContestLeaderboard(contestId);
        socket.emit('leaderboard_update', leaderboard);
        
        // ✅ FIX: Send confirmation
        socket.emit('joined_contest', { 
          contestId, 
          success: true,
          message: 'Successfully joined contest'
        });
      } catch (error) {
        console.error('Error joining contest:', error);
        socket.emit('error', { 
          message: 'Failed to join contest',
          error: error.message 
        });
      }
    });

    // Leave contest room
    socket.on('leave_contest', ({ contestId }) => {
      try {
        const room = `contest_${contestId}`;
        socket.leave(room);
        console.log(`✅ User left contest ${contestId}`);
        
        socket.emit('left_contest', { 
          contestId, 
          success: true 
        });
      } catch (error) {
        console.error('Error leaving contest:', error);
      }
    });

    // ✅ FIX: Handle new submission
    socket.on('submit_solution', async ({ contestId, problemId, userId }) => {
      try {
        const room = `contest_${contestId}`;
        
        // Emit to all users in the contest
        io.to(room).emit('new_submission', {
          userId,
          problemId,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Error handling submission:', error);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ User disconnected:', socket.id, 'Reason:', reason);
    });
  });

  // ✅ FIX: Handle Socket.IO errors
  io.engine.on('connection_error', (err) => {
    console.error('Socket.IO connection error:', {
      code: err.code,
      message: err.message,
      context: err.context
    });
  });

  console.log('✅ Socket.IO initialized successfully');
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

/**
 * Emit leaderboard update to all users in contest
 */
export const emitLeaderboardUpdate = (contestId, leaderboard) => {
  if (!io) {
    console.warn('Socket.IO not initialized, cannot emit leaderboard update');
    return;
  }
  
  const room = `contest_${contestId}`;
  io.to(room).emit('leaderboard_update', leaderboard);
  console.log(`📊 Leaderboard update emitted to contest ${contestId}`);
};

/**
 * Emit contest status change
 */
export const emitContestStatus = (contestId, status) => {
  if (!io) {
    console.warn('Socket.IO not initialized, cannot emit contest status');
    return;
  }
  
  const room = `contest_${contestId}`;
  io.to(room).emit('contest_status', { contestId, status });
  console.log(`🔔 Contest status emitted: ${contestId} - ${status}`);
};

/**
 * Emit new submission notification
 */
export const emitNewSubmission = (contestId, submission) => {
  if (!io) {
    console.warn('Socket.IO not initialized, cannot emit submission');
    return;
  }
  
  const room = `contest_${contestId}`;
  io.to(room).emit('new_submission', submission);
};

/**
 * Get contest leaderboard from cache or database
 */
async function getContestLeaderboard(contestId) {
  try {
    // Try Redis cache first
    const cached = await redis.get(`contest:${contestId}:leaderboard`);
    if (cached) {
      console.log(`✅ Leaderboard cache HIT for contest ${contestId}`);
      return JSON.parse(cached);
    }
    
    console.log(`❌ Leaderboard cache MISS for contest ${contestId}`);
    
    // Return empty array if not cached
    // In production, you'd fetch from database here
    return [];
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

/**
 * Cache contest leaderboard
 */
export const cacheContestLeaderboard = async (contestId, leaderboard, ttl = 10) => {
  try {
    await redis.setex(
      `contest:${contestId}:leaderboard`,
      ttl,
      JSON.stringify(leaderboard)
    );
    console.log(`✅ Cached leaderboard for contest ${contestId}`);
  } catch (error) {
    console.error('Error caching leaderboard:', error);
  }
};

export default {
  initializeSocket,
  getIO,
  emitLeaderboardUpdate,
  emitContestStatus,
  emitNewSubmission,
  cacheContestLeaderboard
};