import express from 'express';
import {
  analyzeSubmission,
  getHints,
  analyzeComplexity,
  getRecommendations
} from '../controllers/ai.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { apiLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// AI analysis routes
router.post('/analyze', apiLimiter, analyzeSubmission);
router.post('/hints', apiLimiter, getHints);
router.post('/complexity', apiLimiter, analyzeComplexity);
router.get('/recommendations', getRecommendations);

export default router;