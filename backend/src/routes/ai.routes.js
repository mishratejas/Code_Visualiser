import express from 'express';
import {
    analyzeSubmission,
    getRecommendations,
    getSkillGapAnalysis,
    analyzeCode,
    startInterview,
    runPlagiarismCheck
} from '../controllers/ai.controller.js';
import { protect, admin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Submission analysis
router.post('/submissions/:id/analyze', analyzeSubmission);
router.post('/analyze/code', analyzeCode);

// Recommendations and learning
router.get('/recommendations', getRecommendations);
router.get('/skill-gap', getSkillGapAnalysis);

// Interview system
router.post('/interview/start', startInterview);

// Admin only routes
router.post('/plagiarism/check', protect, admin, runPlagiarismCheck);

export default router;