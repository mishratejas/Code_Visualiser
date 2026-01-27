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
import { SubmissionValidation } from '../middlewares/validate.middleware.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// ⭐ MOVE THIS BEFORE OTHER ROUTES
router.get('/user/solved', getUserSolvedSubmissions);  // IMPORTANT: Must be before '/'

// Run code in sandbox
router.post('/run', SubmissionValidation.submit, runCode);

// Submit code with rate limiting
router.post('/', submissionLimiter, SubmissionValidation.submit, submitCode);

// Get user submissions with filters
router.get('/', SubmissionValidation.list, getUserSubmissions);

// Get recent submissions
router.get('/recent', getRecentSubmissions);

// Get single submission
router.get('/:id', getSubmission);

// Get problem-specific submissions
router.get('/problem/:problemId', getProblemSubmissions);

export default router;