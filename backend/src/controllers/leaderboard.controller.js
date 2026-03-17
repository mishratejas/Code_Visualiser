import SyncService from '../services/syncService.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import MongoUser from '../models/user.models.js';

// @desc    Get global leaderboard
// @route   GET /api/v1/leaderboard
// @access  Public
export const getLeaderboard = asyncHandler(async (req, res) => {
  const {
    page      = 1,
    limit     = 100,
    timeframe = 'all',
  } = req.query;

  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(parseInt(limit) || 100, 200);
  const offset   = (pageNum - 1) * limitNum;

  // ── Always query MongoDB — it has ALL registered users ──────────────────────
  // Postgres only has users that were explicitly synced (subset), so we use
  // MongoDB as the source of truth and supplement with Postgres stats where available.

  const [users, totalCount] = await Promise.all([
    MongoUser.aggregate([
      { $match: { isActive: { $ne: false } } },
      {
        $project: {
          username:                        1,
          'profile.name':                  1,
          'profile.avatar':                1,
          'profile.country':               1,
          'stats.score':                   1,
          'stats.totalProblemsSolved':     1,
          'stats.easySolved':              1,
          'stats.mediumSolved':            1,
          'stats.hardSolved':              1,
          'stats.streak':                  1,
          'stats.rating':                  1,
          'stats.contestsParticipated':    1,
          'stats.rank':                    1,
        },
      },
      { $sort: { 'stats.score': -1, 'stats.totalProblemsSolved': -1, 'stats.rating': -1 } },
      { $skip: offset },
      { $limit: limitNum },
    ]),
    MongoUser.countDocuments({ isActive: { $ne: false } }),
  ]);

  const leaderboard = users.map((u, idx) => ({
    rank:         offset + idx + 1,
    userId:       u._id?.toString(),
    username:     u.username || `User${offset + idx + 1}`,
    name:         u.profile?.name  || '',
    avatar:       u.profile?.avatar || null,
    country:      u.profile?.country || '',
    totalSolved:  u.stats?.totalProblemsSolved || 0,
    score:        u.stats?.score  || 0,
    rating:       u.stats?.rating || 1500,
    streak:       u.stats?.streak || 0,
    contests:     u.stats?.contestsParticipated || 0,
  }));

  // Trigger background rank update in Postgres (non-blocking, best-effort)
  if (pageNum === 1 && process.env.POSTGRES_URI) {
    SyncService.updateRanks().catch(() => {});
  }

  res.status(200).json(
    ApiResponse.success(
      { leaderboard, timeframe, page: pageNum, limit: limitNum, total: totalCount },
      'Leaderboard fetched successfully'
    )
  );
});

// @desc    Get contest leaderboard
// @route   GET /api/v1/contests/:contestId/leaderboard (also mounted under /leaderboard/contests/:contestId)
// @access  Public
export const getContestLeaderboard = asyncHandler(async (req, res) => {
  const { contestId } = req.params;
  const { limit = 100 } = req.query;

  if (!process.env.POSTGRES_URI) {
    return res.status(200).json(
      ApiResponse.success({ leaderboard: [], message: 'Contest system requires PostgreSQL' }, 'Contest leaderboard')
    );
  }

  const { default: ContestParticipant } = await import('../models/postgres/ContestParticipant.models.js');
  const mongoose = (await import('mongoose')).default;

  const participants = await ContestParticipant.findAll({
    where: { contest_id: contestId, is_disqualified: false },
    order: [['score', 'DESC'], ['penalty', 'ASC'], ['joined_at', 'ASC']],
    limit: parseInt(limit),
  });

  const validIds = participants.map(p => p.user_id).filter(id => mongoose.isValidObjectId(id));
  let userMap = {};
  if (validIds.length) {
    const users = await MongoUser.find({ _id: { $in: validIds } }).select('username profile.avatar').lean();
    users.forEach(u => { userMap[u._id.toString()] = u; });
  }

  const leaderboard = participants.map((p, i) => {
    const u = userMap[p.user_id] || null;
    return {
      rank:           i + 1,
      userId:         p.user_id,
      username:       u?.username || `User_${(p.user_id || '').slice(-6)}`,
      avatar:         u?.profile?.avatar || null,
      score:          p.score   || 0,
      penalty:        p.penalty || 0,
      problemsSolved: p.problems_solved || 0,
      ratingChange:   p.rating_change   || 0,
      problemStats:   p.problem_stats   || {},
    };
  });

  res.status(200).json(
    ApiResponse.success({ leaderboard }, 'Contest leaderboard fetched successfully')
  );
});