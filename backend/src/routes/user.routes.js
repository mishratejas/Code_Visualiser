import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  updateUserPreferences,
  getUserStats,
  getUserActivity,
  getSolvedProblems,
  getAttemptedProblems,
  getBookmarks,
  toggleBookmark,
  updateStreak,
  getLeaderboard,
  searchUsers,
  deleteAccount
} from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { UserValidation } from '../middlewares/validate.middleware.js';

const router = express.Router();

// Public routes
router.get('/leaderboard', getLeaderboard);
router.get('/search', searchUsers);
router.get('/:identifier', getUserProfile);
router.get('/:userId/stats', getUserStats);
router.get('/:userId/activity', getUserActivity);
router.get('/:userId/solved', getSolvedProblems);

// Protected routes (authenticated users)
router.use(authenticate);

// Profile management
router.put('/profile', UserValidation.updateProfile, updateUserProfile);
router.put('/preferences', UserValidation.updatePreferences, updateUserPreferences);

// Bookmarks
router.get('/:userId/bookmarks', getBookmarks);
router.post('/bookmarks/:problemId', toggleBookmark);

// Streak
router.post('/streak/update', updateStreak);

// Attempted problems (only self)
router.get('/:userId/attempted', getAttemptedProblems);

// Account management
router.delete('/account', deleteAccount);

// Admin only routes
router.get('/admin/all', authenticate, authorize('admin'), async (req, res) => {
  // Admin route to get all users
  const users = await User.find({}).select('-password');
  res.json(ApiResponse.success({ users }, 'All users fetched'));
});

export default router;