import { Server } from 'socket.io';
import redis from '../config/redis.config.js';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    // Join contest room
    socket.on('join_contest', async ({ contestId, userId }) => {
      const room = `contest_${contestId}`;
      socket.join(room);
      console.log(`User ${userId} joined contest ${contestId}`);
      
      // Send current leaderboard
      const leaderboard = await getContestLeaderboard(contestId);
      socket.emit('leaderboard_update', leaderboard);
    });

    // Leave contest room
    socket.on('leave_contest', ({ contestId }) => {
      const room = `contest_${contestId}`;
      socket.leave(room);
      console.log(`User left contest ${contestId}`);
    });

    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Emit leaderboard update to all users in contest
export const emitLeaderboardUpdate = (contestId, leaderboard) => {
  const room = `contest_${contestId}`;
  io.to(room).emit('leaderboard_update', leaderboard);
};

// Emit contest status change
export const emitContestStatus = (contestId, status) => {
  const room = `contest_${contestId}`;
  io.to(room).emit('contest_status', { contestId, status });
};

async function getContestLeaderboard(contestId) {
  // Get from Redis cache first
  const cached = await redis.get(`contest:${contestId}:leaderboard`);
  if (cached) return JSON.parse(cached);
  
  // Otherwise fetch from DB
  // Implementation in next section
  return [];
}