import { asyncHandler } from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import aiService from '../services/ai.service.js';
import { STATUS_CODES } from '../constants.js';

/**
 * Analyze code submission with AI
 * POST /api/v1/ai/analyze
 */
export const analyzeSubmission = asyncHandler(async (req, res) => {
  const { submissionId, code, language } = req.body;

  if (!submissionId || !code || !language) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      'Submission ID, code, and language are required'
    );
  }

  const analysis = await aiService.analyzeCode({
    submissionId,
    code,
    language,
    userId: req.user._id
  });

  res.status(STATUS_CODES.OK).json(
    new ApiResponse(
      STATUS_CODES.OK,
      analysis,
      'Code analysis completed successfully'
    )
  );
});

/**
 * Get AI-powered hints for a problem
 * POST /api/v1/ai/hints
 */
export const getHints = asyncHandler(async (req, res) => {
  const { problemId, userCode, difficulty } = req.body;

  if (!problemId) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, 'Problem ID is required');
  }

  const hints = await aiService.generateHints({
    problemId,
    userCode,
    difficulty: difficulty || 'medium',
    userId: req.user._id
  });

  res.status(STATUS_CODES.OK).json(
    new ApiResponse(
      STATUS_CODES.OK,
      hints,
      'Hints generated successfully'
    )
  );
});

/**
 * Get complexity analysis
 * POST /api/v1/ai/complexity
 */
export const analyzeComplexity = asyncHandler(async (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      'Code and language are required'
    );
  }

  const complexityAnalysis = await aiService.analyzeComplexity({
    code,
    language
  });

  res.status(STATUS_CODES.OK).json(
    new ApiResponse(
      STATUS_CODES.OK,
      complexityAnalysis,
      'Complexity analysis completed'
    )
  );
});

/**
 * Get problem recommendations
 * GET /api/v1/ai/recommendations
 */
export const getRecommendations = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const recommendations = await aiService.getRecommendations({
    userId: req.user._id,
    limit: parseInt(limit)
  });

  res.status(STATUS_CODES.OK).json(
    new ApiResponse(
      STATUS_CODES.OK,
      recommendations,
      'Recommendations fetched successfully'
    )
  );
});

export default {
  analyzeSubmission,
  getHints,
  analyzeComplexity,
  getRecommendations
};