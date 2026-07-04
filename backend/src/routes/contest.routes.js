import express from 'express';
import {
  getContests, getMyContests, getContest, createContest, updateContest, deleteContest,
  addProblemsToContest, registerForContest, submitContestSolution,
  getContestLeaderboard, getContestSubmissions, endContest
} from '../controllers/contest.controller.js';
import { authenticate, authorize, optionalAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public
router.get('/', optionalAuth, getContests);

// Authenticated — must be BEFORE /:id to avoid conflict
router.get('/my', authenticate, getMyContests);

router.get('/:id', optionalAuth, getContest);
router.get('/:id/leaderboard', getContestLeaderboard);

// Authenticated users
router.post('/:id/register', authenticate, registerForContest);
router.post('/:id/submit', authenticate, submitContestSolution);
router.get('/:id/submissions', authenticate, getContestSubmissions);

// Admin + Organizer
router.post('/', authenticate, authorize('admin', 'organizer', 'user'), createContest);
router.put('/:id', authenticate, authorize('admin', 'organizer'), updateContest);
router.delete('/:id', authenticate, authorize('admin', 'organizer'), deleteContest);
router.post('/:id/problems', authenticate, authorize('admin', 'organizer', 'user'), addProblemsToContest);
router.post('/:id/end', authenticate, authorize('admin', 'organizer'), endContest);

export default router;