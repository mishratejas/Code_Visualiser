import { io } from 'socket.io-client';

/**
 * ✅ COMPLETE FIX: Socket Service with proper namespace handling
 * 
 * Key fixes:
 * 1. Remove /api/v1 from socket URL (Socket.IO uses its own protocol)
 * 2. Proper connection state management
 * 3. Single connection instance
 */
class SocketService {
  constructor() {
    this.socket = null;
    this.isConnecting = false;
    this.listeners = new Map();
    this.connectionQueue = [];
  }

  connect() {
    // Prevent multiple connection attempts
    if (this.socket?.connected) {
      console.log('✅ Socket already connected:', this.socket.id);
      return this.socket;
    }

    if (this.isConnecting) {
      console.log('⏳ Socket connection already in progress');
      return this.socket;
    }

    this.isConnecting = true;

    try {
      // ✅ FIX: Get base URL and remove /api/v1 path
      let serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';      
      // Remove /api/v1 or any path suffix for Socket.IO
      serverUrl = serverUrl.replace(/\/api\/v\d+\/?$/, '');
      
      console.log('🔌 Connecting to Socket.IO server:', serverUrl);

      this.socket = io(serverUrl, {
        // ✅ FIX: Try WebSocket first, fall back to polling
        transports: ['websocket', 'polling'],
        
        // ✅ FIX: Automatic reconnection
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        
        // ✅ FIX: Timeouts
        timeout: 20000,
        
        // ✅ FIX: Auto-connect
        autoConnect: true,
        
        // ✅ FIX: Force new connection
        forceNew: false,
        
        // ✅ FIX: Multiplex
        multiplex: true,
        
        // ✅ FIX: Additional options
        upgrade: true,
        rememberUpgrade: true,
      });

      // Connection event handlers
      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket.id);
        console.log('✅ Transport:', this.socket.io.engine.transport.name);
        this.isConnecting = false;
        
        // Process queued operations
        this.processQueue();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        this.isConnecting = false;
        
        // Auto-reconnect unless server disconnected us
        if (reason === 'io server disconnect') {
          console.log('🔄 Server disconnected, attempting to reconnect...');
          this.socket.connect();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
        this.isConnecting = false;
        
        // ✅ FIX: Fall back to polling if WebSocket fails
        if (this.socket.io.opts.transports[0] === 'websocket') {
          console.log('🔄 Falling back to polling transport');
          this.socket.io.opts.transports = ['polling', 'websocket'];
        }
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('✅ Socket reconnected after', attemptNumber, 'attempts');
        this.processQueue();
      });

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('🔄 Reconnection attempt', attemptNumber);
      });

      this.socket.on('reconnect_error', (error) => {
        console.error('❌ Reconnection error:', error.message);
      });

      this.socket.on('reconnect_failed', () => {
        console.error('❌ Reconnection failed after all attempts');
        this.isConnecting = false;
      });

      // ✅ FIX: Handle errors from server
      this.socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
      });

      return this.socket;
    } catch (error) {
      console.error('❌ Failed to create socket:', error);
      this.isConnecting = false;
      return null;
    }
  }

  /**
   * Process queued operations after connection
   */
  processQueue() {
    if (this.connectionQueue.length > 0) {
      console.log('📦 Processing', this.connectionQueue.length, 'queued operations');
      this.connectionQueue.forEach(fn => fn());
      this.connectionQueue = [];
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected() {
    return this.socket?.connected || false;
  }

  /**
   * Join personal user notification room
   * Call this once after login so the backend can push real-time notifications
   */
  joinUserRoom(userId) {
    if (!userId) return;
    const joinFn = () => {
      this.socket.emit('join_user_room', { userId });
      console.log('👤 Joined personal notification room for user:', userId);
    };
    if (this.socket?.connected) {
      joinFn();
    } else {
      this.connectionQueue.push(joinFn);
    }
  }

  /**
   * Join a contest room
   */
  joinContest(contestId, userId) {
    if (!this.socket) {
      console.error('❌ Cannot join contest: Socket not initialized');
      return;
    }

    const joinFn = () => {
      console.log('🎯 Joining contest:', contestId);
      this.socket.emit('join_contest', { contestId, userId });
    };

    if (!this.socket.connected) {
      console.warn('⚠️ Socket not connected, queuing join request');
      this.connectionQueue.push(joinFn);
      return;
    }

    joinFn();
  }

  /**
   * Leave a contest room
   */
  leaveContest(contestId) {
    if (!this.socket?.connected) {
      console.warn('⚠️ Cannot leave contest: Socket not connected');
      return;
    }

    console.log('👋 Leaving contest:', contestId);
    this.socket.emit('leave_contest', { contestId });
  }

  /**
   * Listen for leaderboard updates
   */
  onLeaderboardUpdate(callback) {
    if (!this.socket) {
      console.error('❌ Cannot listen for updates: Socket not initialized');
      return;
    }

    console.log('👂 Listening for leaderboard updates');
    
    // Remove old listener if exists
    if (this.listeners.has('leaderboard_update')) {
      this.socket.off('leaderboard_update', this.listeners.get('leaderboard_update'));
    }
    
    this.socket.on('leaderboard_update', callback);
    this.listeners.set('leaderboard_update', callback);
  }

  /**
   * Listen for contest status changes
   */
  onContestStatus(callback) {
    if (!this.socket) {
      console.error('❌ Cannot listen for status: Socket not initialized');
      return;
    }

    console.log('👂 Listening for contest status');
    
    // Remove old listener if exists
    if (this.listeners.has('contest_status')) {
      this.socket.off('contest_status', this.listeners.get('contest_status'));
    }
    
    this.socket.on('contest_status', callback);
    this.listeners.set('contest_status', callback);
  }

  /**
   * Listen for new submissions
   */
  onNewSubmission(callback) {
    if (!this.socket) {
      console.error('❌ Cannot listen for submissions: Socket not initialized');
      return;
    }

    console.log('👂 Listening for new submissions');
    
    // Remove old listener if exists
    if (this.listeners.has('new_submission')) {
      this.socket.off('new_submission', this.listeners.get('new_submission'));
    }
    
    this.socket.on('new_submission', callback);
    this.listeners.set('new_submission', callback);
  }

  /**
   * Remove specific listener
   */
  removeListener(event) {
    if (this.listeners.has(event)) {
      const callback = this.listeners.get(event);
      if (this.socket) {
        this.socket.off(event, callback);
      }
      this.listeners.delete(event);
      console.log('🗑️ Removed listener:', event);
    }
  }

  /**
   * Remove all listeners for a contest
   */
  cleanupContestListeners() {
    console.log('🧹 Cleaning up contest listeners');
    this.removeListener('leaderboard_update');
    this.removeListener('contest_status');
    this.removeListener('new_submission');
  }

  /**
   * Disconnect (use sparingly - only when completely done with socket)
   */
  disconnect() {
    if (!this.socket) {
      return;
    }

    console.log('🔌 Disconnecting socket...');

    // Remove all custom listeners
    this.listeners.forEach((callback, event) => {
      this.socket.off(event, callback);
    });
    this.listeners.clear();
    this.connectionQueue = [];

    // Disconnect
    this.socket.disconnect();
    this.socket = null;
    this.isConnecting = false;
  }

  /**
   * Force reconnect
   */
  reconnect() {
    console.log('🔄 Force reconnecting...');
    if (this.socket) {
      this.disconnect();
    }
    return this.connect();
  }
}

// Export singleton instance
export default new SocketService();