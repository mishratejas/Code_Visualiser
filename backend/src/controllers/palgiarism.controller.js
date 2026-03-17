import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import plagiarismService from '../services/plagiarism.service.js';
import notificationService from '../services/notification.service.js';
import PlagiarismReport from '../models/plagiarism.models.js';
import ContestParticipant from '../models/postgres/ContestParticipant.models.js';
import Contest from '../models/postgres/Contest.models.js';
import User from '../models/user.models.js';

// ─── helpers ────────────────────────────────────────────────────────────────
function expectedScore(rA, rB) { return 1 / (1 + Math.pow(10, (rB - rA) / 400)); }

async function recomputeRatings(contestId) {
  const participants = await ContestParticipant.findAll({
    where: { contest_id: contestId, is_disqualified: false },
    order: [['score','DESC'],['penalty','ASC'],['joined_at','ASC']]
  });
  if (participants.length < 2) return;
  const n = participants.length;
  const expected = participants.map((p, i) => {
    let e = 1;
    for (let j = 0; j < n; j++) if (i !== j) e += expectedScore(participants[j].rating_before, p.rating_before);
    return e;
  });
  const K = 32;
  for (let i = 0; i < n; i++) {
    const p = participants[i];
    const delta = Math.round(K * (expected[i] - (i + 1)) / n * 10);
    const newRating = Math.max(100, p.rating_before + delta);
    await p.update({ rating_after: newRating, rating_change: delta, rank: i + 1 });
    await User.findByIdAndUpdate(p.user_id, {
      $set: { 'stats.rating': newRating },
      $inc: { 'stats.score': delta > 0 ? delta : 0 },
    });
  }
}

// ─── POST /api/v1/plagiarism/check ────────────────────────────────────────────
export const checkPlagiarism = asyncHandler(async (req, res) => {
  const { contestId } = req.body;
  if (!contestId) throw new ApiError(400, 'Contest ID is required');
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin')
    throw new ApiError(403, 'Only admins can run plagiarism checks');

  const result = await plagiarismService.checkContest(contestId, req.user._id);
  res.status(200).json(new ApiResponse(200, result, 'Plagiarism check completed'));
});

// ─── GET /api/v1/plagiarism/contest/:contestId ────────────────────────────────
export const getContestReport = asyncHandler(async (req, res) => {
  const { contestId } = req.params;

  // Use findOne directly so we control the "not found" response (no 500 throw)
  const report = await PlagiarismReport.findOne({ contest: contestId })
    .sort({ checkedAt: -1 })
    .populate('suspiciousPairs.user1', 'username email')
    .populate('suspiciousPairs.user2', 'username email')
    .lean();

  if (!report) {
    return res.status(404).json(new ApiResponse(404, null, 'No plagiarism report found for this contest'));
  }

  res.status(200).json(new ApiResponse(200, report, 'Plagiarism report fetched'));
});

// ─── POST /api/v1/plagiarism/compare ─────────────────────────────────────────
export const compareSubmissions = asyncHandler(async (req, res) => {
  const { submission1Id, submission2Id } = req.body;
  if (!submission1Id || !submission2Id) throw new ApiError(400, 'Both submission IDs required');
  const comparison = await plagiarismService.compareTwo(submission1Id, submission2Id);
  res.status(200).json(new ApiResponse(200, comparison, 'Submissions compared'));
});

// ─── POST /api/v1/plagiarism/review ──────────────────────────────────────────
// Admin reviews a suspicious pair and sets verdict:
//   'plagiarism_confirmed' → disqualify both users, re-run ratings, notify
//   'false_positive'       → clear the flag, notify users they're cleared
//   'common_solution'      → mark as common but don't disqualify
export const reviewPair = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin')
    throw new ApiError(403, 'Admin access required');

  const { contestId, submission1Id, submission2Id, verdict, notes } = req.body;

  if (!['plagiarism_confirmed', 'false_positive', 'common_solution'].includes(verdict))
    throw new ApiError(400, 'Invalid verdict. Use: plagiarism_confirmed | false_positive | common_solution');

  // 1 — update the report pair verdict
  const report = await plagiarismService.reviewPair(
    contestId, submission1Id, submission2Id, verdict, notes, req.user._id
  );

  const pair = report.suspiciousPairs.find(
    p => (p.submission1?.toString() === submission1Id && p.submission2?.toString() === submission2Id) ||
         (p.submission1?.toString() === submission2Id && p.submission2?.toString() === submission1Id)
  );

  const user1Id = pair?.user1?.toString();
  const user2Id = pair?.user2?.toString();
  const contest = await Contest.findByPk(contestId);
  const contestTitle = contest?.title || `Contest #${contestId}`;

  if (verdict === 'plagiarism_confirmed') {
    // 2a — disqualify both participants
    const [p1, p2] = await Promise.all([
      ContestParticipant.findOne({ where: { contest_id: contestId, user_id: user1Id } }),
      ContestParticipant.findOne({ where: { contest_id: contestId, user_id: user2Id } }),
    ]);
    if (p1) await p1.update({ is_disqualified: true, score: 0 });
    if (p2) await p2.update({ is_disqualified: true, score: 0 });

    // 2b — re-run ratings without disqualified users
    if (contest?.is_rated) await recomputeRatings(contestId);

    // 2c — notify both users
    await Promise.allSettled([
      user1Id && notificationService.notifyContest(user1Id, {
        type: 'plagiarism_confirmed', contestTitle, contestId,
      }),
      user2Id && notificationService.notifyContest(user2Id, {
        type: 'plagiarism_confirmed', contestTitle, contestId,
      }),
    ]);

  } else if (verdict === 'false_positive' || verdict === 'common_solution') {
    // 3 — notify users their submission was cleared
    await Promise.allSettled([
      user1Id && notificationService.notifyContest(user1Id, {
        type: 'plagiarism_cleared', contestTitle, contestId,
      }),
      user2Id && notificationService.notifyContest(user2Id, {
        type: 'plagiarism_cleared', contestTitle, contestId,
      }),
    ]);
  }

  res.status(200).json(new ApiResponse(200, {
    verdict,
    contestId,
    user1: user1Id,
    user2: user2Id,
    disqualified: verdict === 'plagiarism_confirmed',
    ratingsRecomputed: verdict === 'plagiarism_confirmed' && !!contest?.is_rated,
  }, `Review saved — verdict: ${verdict}`));
});

export default { checkPlagiarism, getContestReport, compareSubmissions, reviewPair };