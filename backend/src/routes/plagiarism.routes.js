import express from 'express';
import {
  checkPlagiarism,
  getContestReport,
  compareSubmissions,
  reviewPair,
} from '../controllers/palgiarism.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// Admin: trigger full contest check
router.post('/check', checkPlagiarism);

// Anyone authenticated: get report for a contest
router.get('/contest/:contestId', getContestReport);

// Admin: compare exactly 2 submissions
router.post('/compare', compareSubmissions);

// Admin: review a suspicious pair and set verdict (plagiarism_confirmed | false_positive | common_solution)
// Body: { contestId, submission1Id, submission2Id, verdict, notes }
router.post('/review', reviewPair);

export default router;