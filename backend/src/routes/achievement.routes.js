import express from 'express';
import {
  getAllAchievements,
  getUserAchievements,
  getAchievementStats,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  seedAchievements
} from '../controllers/achievement.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllAchievements);

// Protected routes
router.get('/user', protect, getUserAchievements);
router.get('/stats', protect, getAchievementStats);

// Admin routes
router.post('/', protect, authorize('admin'), createAchievement);
router.post('/seed', protect, authorize('admin'), seedAchievements);
router.put('/:id', protect, authorize('admin'), updateAchievement);
router.delete('/:id', protect, authorize('admin'), deleteAchievement);

export default router;