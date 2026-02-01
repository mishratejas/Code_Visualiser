import express from 'express';
import { 
  getContests,
  getContest,
  createContest,
  updateContest,
  deleteContest,
  registerForContest,
  submitContestSolution,
  getContestLeaderboard
} from '../controllers/contest.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getContests);
router.get('/:id', getContest);
router.get('/:id/leaderboard', getContestLeaderboard);

// Protected routes (require authentication)
router.post('/', authenticate, createContest);
router.put('/:id', authenticate, updateContest);
router.delete('/:id', authenticate, deleteContest);
router.post('/:id/register', authenticate, registerForContest);
router.post('/:id/submit', authenticate, submitContestSolution);

export default router;