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
  deleteAccount,
  uploadAvatar,
  deleteAvatar,
  updatePreferences,
  getStreak
} from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { UserValidation } from '../middlewares/validate.middleware.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

// ============ PUBLIC ROUTES (No Auth Required) ============
router.get('/leaderboard', getLeaderboard);
router.get('/search', searchUsers);

// ============ AUTHENTICATED ROUTES ============
router.use(authenticate);

// Current user endpoints (use /me)
router.get('/me/profile', getUserProfile);
router.put('/me/profile', UserValidation.updateProfile, updateUserProfile);
router.put('/me/preferences', UserValidation.updatePreferences, updateUserPreferences);

// Bookmarks
router.get('/me/bookmarks', getBookmarks);
router.post('/bookmarks/:problemId', toggleBookmark);
router.get('/me/solved', getSolvedProblems);

// Streak
router.post('/streak/update', updateStreak);

// Attempted problems
router.get('/me/attempted', getAttemptedProblems);

// Account management
router.delete('/account', deleteAccount);

// Avatar
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.delete('/avatar', deleteAvatar);
router.patch('/preferences', updatePreferences);
router.get('/streak', getStreak);

// ============ PUBLIC USER PROFILES (Must come AFTER /me routes) ============
router.get('/:identifier', getUserProfile);
router.get('/:userId/stats', getUserStats);
router.get('/:userId/activity', getUserActivity);

// ============ ADMIN ROUTES ============
router.get('/admin/all', authorize('admin'), async (req, res) => {
  const User = (await import('../models/user.models.js')).default;
  const ApiResponse = (await import('../utils/ApiResponse.js')).default;
  const users = await User.find({}).select('-password');
  res.json(ApiResponse.success({ users }, 'All users fetched'));
});

export default router;