import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import problemRoutes from './problem.routes.js';
import submissionRoutes from './submission.routes.js';
import contestRoutes from './contest.routes.js';
import plagiarismRoutes from './plagiarism.routes.js';
import leaderboardRoutes from './leaderboard.routes.js';
import notificationRoutes from './notification.routes.js';
import achievementRoutes from './achievement.routes.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    ai_service: process.env.AI_SERVICE_URL || 'http://localhost:8001',
  });
});

router.use('/auth',          authRoutes);
router.use('/users',         userRoutes);
router.use('/problems',      problemRoutes);
router.use('/submissions',   submissionRoutes);
router.use('/contests',      contestRoutes);
router.use('/plagiarism',    plagiarismRoutes);
router.use('/leaderboard',   leaderboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/achievements',  achievementRoutes);

router.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.originalUrl}` });
});

export default router;