import { Server } from 'socket.io';
import redis from '../config/redis.config.js';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
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
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e8,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    }
  });

  // ─── Make io globally available for notification.models.js ─────────────────
  global.io = io;

  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // ─── Personal notification room ─────────────────────────────────────────
    // Client sends { userId } on connect so we can push personal notifications
    socket.on('join_user_room', ({ userId }) => {
      if (!userId) return;
      const room = `user-${userId}`;
      socket.join(room);
      console.log(`👤 User ${userId} joined personal room`);
    });

    // ─── Contest room ────────────────────────────────────────────────────────
    socket.on('join_contest', async ({ contestId, userId }) => {
      try {
        const room = `contest_${contestId}`;
        socket.join(room);
        console.log(`✅ User ${userId} joined contest ${contestId}`);

        const leaderboard = await getContestLeaderboard(contestId);
        socket.emit('leaderboard_update', leaderboard);
        socket.emit('joined_contest', { contestId, success: true });
      } catch (error) {
        console.error('Error joining contest:', error);
        socket.emit('error', { message: 'Failed to join contest', error: error.message });
      }
    });

    socket.on('leave_contest', ({ contestId }) => {
      try {
        socket.leave(`contest_${contestId}`);
        console.log(`✅ User left contest ${contestId}`);
        socket.emit('left_contest', { contestId, success: true });
      } catch (error) {
        console.error('Error leaving contest:', error);
      }
    });

    socket.on('submit_solution', async ({ contestId, problemId, userId }) => {
      try {
        io.to(`contest_${contestId}`).emit('new_submission', {
          userId, problemId, timestamp: Date.now()
        });
      } catch (error) {
        console.error('Error handling submission:', error);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ User disconnected:', socket.id, 'Reason:', reason);
    });
  });

  io.engine.on('connection_error', (err) => {
    console.error('Socket.IO connection error:', { code: err.code, message: err.message });
  });

  console.log('✅ Socket.IO initialized successfully');
  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

// ─── Emit helpers ────────────────────────────────────────────────────────────

export const emitLeaderboardUpdate = (contestId, leaderboard) => {
  if (!io) { console.warn('Socket.IO not initialized'); return; }
  io.to(`contest_${contestId}`).emit('leaderboard_update', leaderboard);
  console.log(`📊 Leaderboard update emitted to contest ${contestId}`);
};

export const emitContestStatus = (contestId, status) => {
  if (!io) { console.warn('Socket.IO not initialized'); return; }
  io.to(`contest_${contestId}`).emit('contest_status', { contestId, status });
  console.log(`🔔 Contest status emitted: ${contestId} - ${status}`);
};

export const emitNewSubmission = (contestId, submission) => {
  if (!io) { console.warn('Socket.IO not initialized'); return; }
  io.to(`contest_${contestId}`).emit('new_submission', submission);
};

// ─── Personal notification emit (used by notification.models.js global.io) ──
export const emitNotificationToUser = (userId, notification) => {
  if (!io) return;
  io.to(`user-${userId}`).emit('notification', notification);
};

async function getContestLeaderboard(contestId) {
  try {
    const cached = await redis.get(`contest:${contestId}:leaderboard`);
    if (cached) return JSON.parse(cached);
    return [];
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

export const cacheContestLeaderboard = async (contestId, leaderboard, ttl = 10) => {
  try {
    await redis.setex(`contest:${contestId}:leaderboard`, ttl, JSON.stringify(leaderboard));
  } catch (error) {
    console.error('Error caching leaderboard:', error);
  }
};

export default {
  initializeSocket, getIO,
  emitLeaderboardUpdate, emitContestStatus, emitNewSubmission,
  emitNotificationToUser, cacheContestLeaderboard
};