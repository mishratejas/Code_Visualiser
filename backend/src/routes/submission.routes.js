import express from 'express';
import {
  submitCode,
  getUserSubmissions,
  getSubmission,
  getProblemSubmissions,
  getRecentSubmissions,
  runCode
} from '../controllers/submission.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { submissionLimiter } from '../middlewares/rateLimiter.middleware.js';
import { SubmissionValidation } from '../middlewares/validate.middleware.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Submit code with rate limiting
router.post(
  '/',
  submissionLimiter,
  SubmissionValidation.submit,
  submitCode
);

// Run code in sandbox (no rate limiting for testing)
router.post(
  '/run',
  SubmissionValidation.submit,
  runCode
);

// Get user submissions with filters
router.get(
  '/',
  SubmissionValidation.list,
  getUserSubmissions
);

// Get recent submissions for dashboard
router.get(
  '/recent',
  getRecentSubmissions
);

// Get single submission
router.get(
  '/:id',
  getSubmission
);

// Get problem-specific submissions
router.get(
  '/problem/:problemId',
  getProblemSubmissions
);

export default router;