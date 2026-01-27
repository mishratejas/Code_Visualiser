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

// ============ PUBLIC ROUTES (No Auth Required) ============
router.get('/leaderboard', getLeaderboard);
router.get('/search', searchUsers);

// ============ AUTHENTICATED ROUTES ============
router.use(authenticate);

// Current user endpoints (use /me)
router.get('/me/profile', getUserProfile);
router.put('/me/profile', UserValidation.updateProfile, updateUserProfile);
router.put('/me/preferences', UserValidation.updatePreferences, updateUserPreferences);

// ⭐ CRITICAL: These are what your Problems.jsx is calling
router.get('/me/bookmarks', getBookmarks);           // GET /api/v1/users/me/bookmarks
router.post('/bookmarks/:problemId', toggleBookmark); // POST /api/v1/users/bookmarks/:problemId
router.get('/me/solved', getSolvedProblems);          // GET /api/v1/users/me/solved

// Streak
router.post('/streak/update', updateStreak);

// Attempted problems
router.get('/me/attempted', getAttemptedProblems);

// Account management
router.delete('/account', deleteAccount);

// ============ PUBLIC USER PROFILES (Must come AFTER /me routes) ============
router.get('/:identifier', getUserProfile);         // GET /api/v1/users/username
router.get('/:userId/stats', getUserStats);         // GET /api/v1/users/:userId/stats
router.get('/:userId/activity', getUserActivity);   // GET /api/v1/users/:userId/activity

// ============ ADMIN ROUTES ============
router.get('/admin/all', authorize('admin'), async (req, res) => {
  const User = (await import('../models/mongo/User.model.js')).default;
  const ApiResponse = (await import('../utils/ApiResponse.js')).default;
  
  const users = await User.find({}).select('-password');
  res.json(ApiResponse.success({ users }, 'All users fetched'));
});

export default router;