import { asyncHandler } from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import interviewService from '../services/interview.service.js';
import { STATUS_CODES } from '../constants.js';

/**
 * Start a new interview session
 * POST /api/v1/interview/start
 */
export const startInterview = asyncHandler(async (req, res) => {
  const { difficulty, topics, duration } = req.body;

  const interview = await interviewService.startSession({
    userId: req.user._id,
    difficulty: difficulty || 'medium',
    topics: topics || [],
    duration: duration || 30
  });

  res.status(STATUS_CODES.CREATED).json(
    new ApiResponse(
      STATUS_CODES.CREATED,
      interview,
      'Interview session started successfully'
    )
  );
});

/**
 * Submit answer for interview question
 * POST /api/v1/interview/:interviewId/submit
 */
export const submitAnswer = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;
  const { code, explanation } = req.body;

  if (!code) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, 'Code is required');
  }

  const result = await interviewService.submitAnswer({
    interviewId,
    userId: req.user._id,
    code,
    explanation: explanation || ''
  });

  res.status(STATUS_CODES.OK).json(
    new ApiResponse(
      STATUS_CODES.OK,
      result,
      'Answer submitted successfully'
    )
  );
});

/**
 * Get interview report
 * GET /api/v1/interview/:interviewId/report
 */
export const getReport = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;

  const report = await interviewService.generateReport({
    interviewId,
    userId: req.user._id
  });

  res.status(STATUS_CODES.OK).json(
    new ApiResponse(
      STATUS_CODES.OK,
      report,
      'Interview report generated successfully'
    )
  );
});

/**
 * Get interview history
 * GET /api/v1/interview/history
 */
export const getHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const history = await interviewService.getHistory({
    userId: req.user._id,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  res.status(STATUS_CODES.OK).json(
    new ApiResponse(
      STATUS_CODES.OK,
      history,
      'Interview history fetched successfully'
    )
  );
});

export default {
  startInterview,
  submitAnswer,
  getReport,
  getHistory
};