import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import problemRoutes from './problem.routes.js';
import submissionRoutes from './submission.routes.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Documentation
router.get('/docs', (req, res) => {
  res.json({
    message: 'Coding Judge API Documentation',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      problems: '/api/v1/problems',
      submissions: '/api/v1/submissions'
    },
    version: '1.0.0'
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/problems', problemRoutes);
router.use('/submissions', submissionRoutes);

// 404 handler for undefined API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    error: 'Not Found'
  });
});

export default router;