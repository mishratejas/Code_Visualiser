import express from 'express';
import {
  submitCode,
  getUserSubmissions,
  getSubmission,
  getProblemSubmissions,
  getRecentSubmissions,
  runCode,
  getUserSolvedSubmissions
} from '../controllers/submission.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { submissionLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// IMPORTANT: Order matters - specific routes before dynamic routes
router.get('/user/solved', getUserSolvedSubmissions);
router.get('/recent', getRecentSubmissions);
router.get('/problem/:problemId', getProblemSubmissions);
router.post('/run', submissionLimiter, runCode);
router.post('/', submissionLimiter, submitCode);
router.get('/', getUserSubmissions);
router.get('/:id', getSubmission);

export default router;