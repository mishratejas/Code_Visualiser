import SyncService from '../services/syncService.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get global leaderboard
// @route   GET /api/v1/leaderboard
// @access  Public
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 50,
    timeframe = 'all' // 'all', 'weekly', 'monthly'
  } = req.query;
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = Math.min(parseInt(limit), 100);
  
  let leaderboard;
  
  // Use PostgreSQL if available, fallback to MongoDB
  if (process.env.POSTGRES_URI) {
    leaderboard = await SyncService.getLeaderboard(limitNum, offset);
    
    // If timeframe is not 'all', we need to filter by date
    if (timeframe !== 'all') {
      // This would require a more complex query with activity tracking
      // For now, return all and filter client-side or implement later
    }
  } else {
    // MongoDB fallback
    leaderboard = await User.aggregate([
      { $match: { isActive: true } },
      { $project: {
        username: 1,
        'profile.name': 1,
        'profile.avatar': 1,
        'profile.country': 1,
        'stats.score': 1,
        'stats.totalProblemsSolved': 1,
        'stats.easySolved': 1,
        'stats.mediumSolved': 1,
        'stats.hardSolved': 1,
        'stats.streak': 1,
        'stats.rank': 1
      }},
      { $sort: { 'stats.score': -1 } },
      { $skip: offset },
      { $limit: limitNum }
    ]);
  }
  
  // Update ranks if needed (run as background job, not on every request)
  if (page === 1 && process.env.POSTGRES_URI) {
    // Run in background without awaiting
    SyncService.updateRanks().catch(console.error);
  }
  
  res.status(200).json(
    ApiResponse.success(
      { leaderboard, timeframe, page: parseInt(page), limit: limitNum },
      'Leaderboard fetched successfully'
    )
  );
});

// @desc    Get contest leaderboard
// @route   GET /api/v1/contests/:contestId/leaderboard
// @access  Public
export const getContestLeaderboard = asyncHandler(async (req, res) => {
  const { contestId } = req.params;
  const { limit = 100 } = req.query;
  
  if (!process.env.POSTGRES_URI) {
    return res.status(200).json(
      ApiResponse.success(
        { leaderboard: [], message: 'Contest system requires PostgreSQL' },
        'Contest leaderboard'
      )
    );
  }
  
  const leaderboard = await SyncService.getContestLeaderboard(contestId, limit);
  
  // Calculate ranks for this contest
  leaderboard.forEach((participant, index) => {
    participant.dataValues.contestRank = index + 1;
  });
  
  res.status(200).json(
    ApiResponse.success(
      { leaderboard },
      'Contest leaderboard fetched successfully'
    )
  );
});