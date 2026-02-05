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
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// =====================================
// PUBLIC ROUTES
// =====================================
router.get('/', getContests);
router.get('/:id', getContest);
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