import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import plagiarismService from '../services/plagiarism.service.js';
import notificationService from '../services/notification.service.js';
import ContestParticipant from '../models/postgres/ContestParticipant.models.js';
import Contest from '../models/postgres/Contest.models.js';
import User from '../models/user.models.js';

// ─── helpers ─────────────────────────────────────────────────────────────────
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
    const newRating = Math.max(100, (p.rating_before || 1500) + delta);
    await p.update({ rating_after: newRating, rating_change: delta, rank: i + 1 });
    await User.findByIdAndUpdate(p.user_id, {
      $set: { 'stats.rating': newRating },
      $inc: { 'stats.score': delta > 0 ? delta : 0 },
    });
  }
}

// ─── POST /api/v1/plagiarism/check ───────────────────────────────────────────
export const checkPlagiarism = asyncHandler(async (req, res) => {
  const { contestId } = req.body;
  if (!contestId) throw new ApiError(400, 'Contest ID is required');
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin')
    throw new ApiError(403, 'Only admins can run plagiarism checks');

  const result = await plagiarismService.checkContest(contestId, req.user._id);

  // After check, enrich user data the same way getReport does
  let enrichedResult = result;
  try {
    enrichedResult = await plagiarismService.getReport(contestId);
  } catch { /* fallback to raw result */ }

  // ApiResponse.success(data, message) — correct arg order
  res.status(200).json(ApiResponse.success(enrichedResult, 'Plagiarism check completed'));
});

// ─── GET /api/v1/plagiarism/contest/:contestId ────────────────────────────────
// Uses plagiarismService.getReport() which does manual User.find() lookup.
// DO NOT use PlagiarismReport.findOne().populate() — user1/user2 are stored as
// plain hex strings, not ObjectId refs, so populate() silently returns null,
// causing the frontend to show "No pairs match this filter".
export const getContestReport = asyncHandler(async (req, res) => {
  const { contestId } = req.params;

  let report;
  try {
    report = await plagiarismService.getReport(contestId);
  } catch (e) {
    if (e.message?.includes('No plagiarism report found')) {
      return res.status(404).json(ApiResponse.success(null, 'No plagiarism report found for this contest'));
    }
    throw e;
  }

  res.status(200).json(ApiResponse.success(report, 'Plagiarism report fetched'));
});

// ─── POST /api/v1/plagiarism/compare ─────────────────────────────────────────
export const compareSubmissions = asyncHandler(async (req, res) => {
  const { submission1Id, submission2Id } = req.body;
  if (!submission1Id || !submission2Id) throw new ApiError(400, 'Both submission IDs required');
  const comparison = await plagiarismService.compareTwo(submission1Id, submission2Id);
  res.status(200).json(ApiResponse.success(comparison, 'Submissions compared'));
});

// ─── POST /api/v1/plagiarism/review ──────────────────────────────────────────
export const reviewPair = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin')
    throw new ApiError(403, 'Admin access required');

  const {
    contestId, submission1Id, submission2Id, verdict, notes,
    banUsers = false, banDurationDays = 7, ratingPenalty = 0,
    user1Id: overrideUser1Id, user2Id: overrideUser2Id,
  } = req.body;

  if (!['plagiarism_confirmed', 'false_positive', 'common_solution'].includes(verdict))
    throw new ApiError(400, 'Invalid verdict. Use: plagiarism_confirmed | false_positive | common_solution');

  // 1 — update verdict in the report
  const report = await plagiarismService.reviewPair(
    contestId, submission1Id, submission2Id, verdict, notes, req.user._id
  );

  const pair = report.suspiciousPairs.find(
    p => (p.submission1?.toString() === submission1Id && p.submission2?.toString() === submission2Id) ||
         (p.submission1?.toString() === submission2Id && p.submission2?.toString() === submission1Id)
  );

  // user1/user2 may be enriched objects (from getReport) or raw strings
  const user1Id = pair?.user1?._id?.toString() || pair?.user1?.toString();
  const user2Id = pair?.user2?._id?.toString() || pair?.user2?.toString();
  const contest = await Contest.findByPk(contestId);
  const contestTitle = contest?.title || `Contest #${contestId}`;

  if (verdict === 'plagiarism_confirmed') {
    const [p1, p2] = await Promise.all([
      ContestParticipant.findOne({ where: { contest_id: contestId, user_id: user1Id } }),
      ContestParticipant.findOne({ where: { contest_id: contestId, user_id: user2Id } }),
    ]);
    if (p1) await p1.update({ is_disqualified: true, score: 0 });
    if (p2) await p2.update({ is_disqualified: true, score: 0 });

    if (contest?.is_rated) await recomputeRatings(contestId);

    // Apply ban and/or rating penalty if requested by admin
    const userIds = [user1Id, user2Id].filter(Boolean);
    if (userIds.length > 0) {
      const mongoUpdates = {};

      if (banUsers && banDurationDays > 0) {
        const banUntil = new Date(Date.now() + banDurationDays * 24 * 60 * 60 * 1000);
        mongoUpdates['security.lockUntil'] = banUntil;
        mongoUpdates['security.failedLoginAttempts'] = 10; // force lock
        // Also record the contest-specific ban so Profile page can display it
        mongoUpdates['security.contestBannedUntil'] = banUntil;
        console.log(`Banning users ${userIds.join(', ')} until ${banUntil.toISOString()}`);
      }

      if (ratingPenalty > 0) {
        // Deduct rating from each user's MongoDB stats
        await Promise.allSettled(userIds.map(uid =>
          User.findByIdAndUpdate(uid, {
            $inc: { 'stats.rating': -Math.abs(ratingPenalty) },
          })
        ));
        console.log(`Applied -${ratingPenalty} rating penalty to users ${userIds.join(', ')}`);
      }

      if (Object.keys(mongoUpdates).length > 0) {
        await Promise.allSettled(userIds.map(uid =>
          User.findByIdAndUpdate(uid, { $set: mongoUpdates })
        ));
      }
    }

    await Promise.allSettled([
      user1Id && notificationService.notifyContest(user1Id, { type: 'plagiarism_confirmed', contestTitle, contestId }),
      user2Id && notificationService.notifyContest(user2Id, { type: 'plagiarism_confirmed', contestTitle, contestId }),
    ]);

  } else if (verdict === 'false_positive' || verdict === 'common_solution') {
    await Promise.allSettled([
      user1Id && notificationService.notifyContest(user1Id, { type: 'plagiarism_cleared', contestTitle, contestId }),
      user2Id && notificationService.notifyContest(user2Id, { type: 'plagiarism_cleared', contestTitle, contestId }),
    ]);
  }

  res.status(200).json(ApiResponse.success({
    verdict,
    contestId,
    user1: user1Id,
    user2: user2Id,
    disqualified: verdict === 'plagiarism_confirmed',
    ratingsRecomputed: verdict === 'plagiarism_confirmed' && !!contest?.is_rated,
    banned: verdict === 'plagiarism_confirmed' && banUsers,
    banDurationDays: verdict === 'plagiarism_confirmed' && banUsers ? banDurationDays : 0,
    ratingPenaltyApplied: verdict === 'plagiarism_confirmed' && ratingPenalty > 0 ? ratingPenalty : 0,
  }, `Review saved — verdict: ${verdict}`));
});

export default { checkPlagiarism, getContestReport, compareSubmissions, reviewPair };