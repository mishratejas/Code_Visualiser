import express from 'express';
import {
  register,
  registerOrganizer,
  login,
  logout,
  getMe,
  updateProfile,
  updatePreferences,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  changePassword,
  googleAuthCallback
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimiter.middleware.js';
import passport from 'passport';
import '../config/passport.js';

const router = express.Router();

// Public routes with rate limiting
router.post('/register', authLimiter, register);
router.post('/register/organizer', authLimiter, registerOrganizer);
router.post('/login', authLimiter, login);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google_auth_failed` }), 
  googleAuthCallback
);

// Password reset
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

export default router;