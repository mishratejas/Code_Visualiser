import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    return this.socket;
  }

  joinContest(contestId, userId) {
    if (this.socket) {
      this.socket.emit('join_contest', { contestId, userId });
    }
  }

  leaveContest(contestId) {
    if (this.socket) {
      this.socket.emit('leave_contest', { contestId });
    }
  }

  onLeaderboardUpdate(callback) {
    if (this.socket) {
      this.socket.on('leaderboard_update', callback);
    }
  }

  onContestStatus(callback) {
    if (this.socket) {
      this.socket.on('contest_status', callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new SocketService();