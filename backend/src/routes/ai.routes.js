import express from 'express';
import {
    analyzeSubmission,
    getRecommendations,
    getSkillGapAnalysis,
    analyzeCode,
    startInterview,
    runPlagiarismCheck
} from '../controllers/ai.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// SUBMISSION ANALYSIS ROUTES
// ============================================

// Analyze a specific submission
router.post('/submissions/:id/analyze', analyzeSubmission);

// Real-time code analysis (no submission required)
router.post('/analyze/code', analyzeCode);

// ============================================
// RECOMMENDATIONS & LEARNING ROUTES
// ============================================

// Get personalized problem recommendations
router.get('/recommendations', getRecommendations);

// Get user's skill gap analysis
router.get('/skill-gap', getSkillGapAnalysis);

// ============================================
// INTERVIEW SYSTEM ROUTES
// ============================================

// Start an AI-powered interview session
router.post('/interview/start', startInterview);

// ============================================
// PLAGIARISM DETECTION (ADMIN ONLY)
// ============================================

// Run plagiarism check for a contest (admin only)
router.post('/plagiarism/check', authorize('admin'), runPlagiarismCheck);

export default router;