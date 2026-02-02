import express from 'express';
import { 
  getContests,
  getContest,
  createContest,
  updateContest,
  deleteContest,
  addProblemsToContest, // ✅ NEW
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
router.post('/', authenticate, createContest);
router.put('/:id', authenticate, updateContest);
router.delete('/:id', authenticate, deleteContest);

// ✅ NEW: Add problems to contest
router.post('/:id/problems', authenticate, addProblemsToContest);

// Contest participation
router.post('/:id/register', authenticate, registerForContest);
router.post('/:id/submit', authenticate, submitContestSolution);

export default router;