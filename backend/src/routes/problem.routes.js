import express from 'express';
import {
  getAllProblems,
  getProblem,
  getProblemBySlug,
  createProblem,
  updateProblem,
  deleteProblem,
  togglePublish,
  getProblemStats,
  getProblemsByDifficulty,
  searchProblems,
  getTagStats,
  runTestCases,
  getProblemDiscussion,
  likeProblem,
  getSimilarProblems,
  getProblemEditorial
} from '../controllers/problem.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ProblemValidation } from '../middlewares/validate.middleware.js';
import { submissionLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllProblems);
router.get('/search', searchProblems);
router.get('/tags/stats', getTagStats);
router.get('/difficulty/:level', getProblemsByDifficulty);
router.get('/:id', ProblemValidation.idParam, getProblem);
router.get('/slug/:slug', ProblemValidation.slugParam, getProblemBySlug);
router.get('/:id/stats', ProblemValidation.idParam, getProblemStats);
router.get('/:id/discussion', ProblemValidation.idParam, getProblemDiscussion);
router.get('/:id/editorial', ProblemValidation.idParam, getProblemEditorial);
router.get('/:id/similar', ProblemValidation.idParam, getSimilarProblems);

// Authenticated routes
router.post('/:id/like', authenticate, likeProblem);

// Test case runner (for problem creation)
router.post(
  '/test-run',
  authenticate,
  authorize('admin'),
  submissionLimiter,
  runTestCases
);

// Admin only routes
router.post(
  '/',
  authenticate,
  authorize('admin'),
  ProblemValidation.create,
  createProblem
);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  ProblemValidation.update,
  updateProblem
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  ProblemValidation.idParam,
  deleteProblem
);

router.patch(
  '/:id/publish',
  authenticate,
  authorize('admin'),
  ProblemValidation.idParam,
  togglePublish
);

export default router;