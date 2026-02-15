import express from 'express';
import { 
  getContests,
  getContest,
  createContest,
  updateContest,
  deleteContest,
  addProblemsToContest,
  registerForContest,
  submitContestSolution,
  getContestLeaderboard
} from '../controllers/contest.controller.js';
import { authenticate, authorize, optionalAuth } from '../middlewares/auth.middleware.js';
import Contest from '../models/postgres/Contest.models.js';
import ContestParticipant from '../models/postgres/ContestParticipant.models.js';
import ContestSubmission from '../models/postgres/ContestSubmission.models.js';
import Problem from '../models/problem.models.js';
const router = express.Router();

// =====================================
// PUBLIC ROUTES
// =====================================
router.get('/', optionalAuth, getContests);
router.get('/:id', optionalAuth, getContest);
router.get('/:id/leaderboard', getContestLeaderboard);

// =====================================
// PROTECTED ROUTES (REQUIRE AUTHENTICATION)
// =====================================

// ✅ ADMIN ONLY - Contest Management
router.post('/', authenticate, authorize('admin'), createContest);
router.put('/:id', authenticate, authorize('admin'), updateContest);
router.delete('/:id', authenticate, authorize('admin'), deleteContest);
router.post('/:id/problems', authenticate, authorize('admin'), addProblemsToContest);

// ✅ USER - Contest Participation
router.post('/:id/register', authenticate, registerForContest);
router.post('/:id/submit', authenticate, submitContestSolution);

export default router;