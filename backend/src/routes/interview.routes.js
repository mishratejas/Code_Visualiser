import express from 'express';
import {
  startInterview,
  submitAnswer,
  getReport,
  getHistory
} from '../controllers/interview.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { apiLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Interview routes
router.post('/start', apiLimiter, startInterview);
router.post('/:interviewId/submit', apiLimiter, submitAnswer);
router.get('/:interviewId/report', getReport);
router.get('/history', getHistory);

export default router;