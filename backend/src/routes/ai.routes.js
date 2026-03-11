/**
 * AI Routes — Node backend proxies all /api/v1/ai/* to FastAPI AI service (:8001)
 * 
 * This way the frontend only ever talks to one backend (:8000).
 * The AI service is an internal microservice.
 */
import express from 'express';
import axios from 'axios';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();
const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

const proxyToAI = (path) => async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${AI_URL}${path}`,
      data: req.body,
      timeout: 45000,
    });
    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 503;
    const detail = err.response?.data?.detail || 'AI service unavailable';
    res.status(status).json({ success: false, message: detail });
  }
};

// All AI routes require authentication
router.use(protect);

// Code analysis (full: Gemini + structural)
router.post('/analyze',          proxyToAI('/api/v1/analyze/code'));

// Quick structural complexity only (no Gemini call)
router.post('/complexity',       proxyToAI('/api/v1/analyze/complexity'));

// Interview
router.post('/interview/question',     proxyToAI('/api/v1/interview/question'));
router.post('/interview/evaluate',     proxyToAI('/api/v1/interview/evaluate'));
router.post('/interview/hint',         proxyToAI('/api/v1/interview/hint'));
router.post('/interview/check-explanation', proxyToAI('/api/v1/interview/check-explanation'));

// Recommendations
router.post('/recommendations',  proxyToAI('/api/v1/recommendations/problems'));
router.post('/learning-path',    proxyToAI('/api/v1/recommendations/learning-path'));

export default router;