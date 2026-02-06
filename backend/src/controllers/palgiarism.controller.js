import { asyncHandler } from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import plagiarismService from '../services/plagiarism.service.js';
import { STATUS_CODES } from '../constants.js';

/**
 * Check plagiarism for contest submissions
 * POST /api/v1/plagiarism/check
 */
export const checkPlagiarism = asyncHandler(async (req, res) => {
  const { contestId } = req.body;

  if (!contestId) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, 'Contest ID is required');
  }

  // Only admins can run plagiarism checks
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    throw new ApiError(
      STATUS_CODES.FORBIDDEN,
      'Only admins can run plagiarism checks'
    );
  }

  const result = await plagiarismService.checkContest(contestId);

  res.status(STATUS_CODES.OK).json(
    new ApiResponse(
      STATUS_CODES.OK,
      result,
      'Plagiarism check completed successfully'
    )
  );
});

/**
 * Get plagiarism report for a contest
 * GET /api/v1/plagiarism/contest/:contestId
 */
export const getContestReport = asyncHandler(async (req, res) => {
  const { contestId } = req.params;

  const report = await plagiarismService.getReport(contestId);

  res.status(STATUS_CODES.OK).json(
    new ApiResponse(
      STATUS_CODES.OK,
      report,
      'Plagiarism report fetched successfully'
    )
  );
});

/**
 * Compare two specific submissions
 * POST /api/v1/plagiarism/compare
 */
export const compareSubmissions = asyncHandler(async (req, res) => {
  const { submission1Id, submission2Id } = req.body;

  if (!submission1Id || !submission2Id) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      'Both submission IDs are required'
    );
  }

  const comparison = await plagiarismService.compareTwo(
    submission1Id,
    submission2Id
  );

  res.status(STATUS_CODES.OK).json(
    new ApiResponse(
      STATUS_CODES.OK,
      comparison,
      'Submissions compared successfully'
    )
  );
});

export default {
  checkPlagiarism,
  getContestReport,
  compareSubmissions
};  ``