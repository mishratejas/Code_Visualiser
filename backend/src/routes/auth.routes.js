import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  updatePreferences,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  changePassword
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimiter.middleware.js';
// Remove upload import for now since we don't have multer setup

const router = express.Router();

// Public routes with rate limiting
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);
router.post('/verify-email/:token', verifyEmail);
router.post('/resend-verification', authLimiter, resendVerification);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/preferences', authenticate, updatePreferences);
router.put('/change-password', authenticate, changePassword);

// Remove avatar route for now
// router.put('/avatar', authenticate, upload.single('avatar'), updateAvatar);

export default router;