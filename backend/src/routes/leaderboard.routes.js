import express from 'express';
import {
  getLeaderboard,
  getContestLeaderboard
} from '../controllers/leaderboard.controller.js';

const router = express.Router();

// Public routes
router.get('/', getLeaderboard);
router.get('/contests/:contestId', getContestLeaderboard);

export default router;