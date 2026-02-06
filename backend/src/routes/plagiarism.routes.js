import express from 'express';
import {
  checkPlagiarism,
  getContestReport,
  compareSubmissions
} from '../controllers/palgiarism.controller.js'; // Note: typo in filename
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { USER_ROLES } from '../constants.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Plagiarism check routes (admin only)
router.post(
  '/check',
  restrictTo(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  checkPlagiarism
);

router.get('/contest/:contestId', getContestReport);

router.post(
  '/compare',
  restrictTo(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  compareSubmissions
);

export default router;