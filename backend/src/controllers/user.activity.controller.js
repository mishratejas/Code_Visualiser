/**
 * user.activity.controller.js — stats, activity, bookmarks, leaderboard, search.
 *
 * M4 fix: split out of user.controller.js (811 lines mixing profile,
 * settings, and stats/activity concerns — audit finding M4). This file
 * covers read-heavy, mostly-public discovery/stats endpoints — the parts of
 * the old file that had nothing to do with editing "your own" account.
 */
import User from '../models/user.models.js';
import Submission from '../models/submission.models.js';
import Problem from '../models/problem.models.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import mongoose from 'mongoose';

// @desc    Get user statistics
// @route   GET /api/v1/users/:userId/stats
// @access  Public
export const getUserStats = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  console.log('Getting stats for user ID:', userId);
  
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.log('Invalid user ID format:', userId);
    throw ApiError.badRequest('Invalid user ID format');
  }
  
  const user = await User.findById(userId).select('username stats');
  
  if (!user) {
    console.log('User not found for ID:', userId);
    throw ApiError.notFound('User not found');
  }
  
  console.log('Found user:', user.username);
  
  try {
    // Get detailed submission stats
    const submissionStats = await Submission.aggregate([
      { $match: { user:new mongoose.Types.ObjectId(userId) } },
      { $group: {
        _id: '$verdict',
        count: { $sum: 1 }
      }}
    ]);
    
    console.log('Submission stats:', submissionStats);
    
    // Get language distribution
    const languageStats = await Submission.aggregate([
      { $match: { user:new mongoose.Types.ObjectId(userId) } },
      { $group: {
        _id: '$language',
        count: { $sum: 1 },
        accepted: { 
          $sum: { $cond: [{ $eq: ['$verdict', 'accepted'] }, 1, 0] }
        }
      }},
      { $sort: { count: -1 } }
    ]);
    
    console.log('Language stats:', languageStats);
    
    // Get daily activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyActivity = await Submission.aggregate([
      { $match: { 
        user:new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: thirtyDaysAgo }
      }},
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
        accepted: { 
          $sum: { $cond: [{ $eq: ['$verdict', 'accepted'] }, 1, 0] }
        }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    console.log('Daily activity:', dailyActivity.length, 'days');
    
    // Get problem solving timeline
    const solvedTimeline = await Submission.aggregate([
      { $match: { 
        user:new mongoose.Types.ObjectId(userId),
        verdict: 'accepted'
      }},
      { $lookup: {
        from: 'problems',
        localField: 'problem',
        foreignField: '_id',
        as: 'problem'
      }},
      { $unwind: '$problem' },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        problemsSolved: { $addToSet: '$problem._id' }
      }},
      { $project: {
        month: '$_id',
        count: { $size: '$problemsSolved' },
        _id: 0
      }},
      { $sort: { month: 1 } }
    ]);
    
    console.log('Solved timeline:', solvedTimeline);
    
    res.status(200).json(
      ApiResponse.success({
        user: {
          username: user.username,
          stats: user.stats
        },
        detailedStats: {
          submissionStats,
          languageStats,
          dailyActivity,
          solvedTimeline
        }
      }, 'User statistics fetched successfully')
    );
  } catch (error) {
    console.error('Error in getUserStats:', error);
    // Return basic stats if aggregation fails
    res.status(200).json(
      ApiResponse.success({
        user: {
          username: user.username,
          stats: user.stats
        },
        detailedStats: {
          submissionStats: [],
          languageStats: [],
          dailyActivity: [],
          solvedTimeline: []
        }
      }, 'Basic user statistics fetched')
    );
  }
});

// @desc    Get user activity timeline
// @route   GET /api/v1/users/:userId/activity
// @access  Public
export const getUserActivity = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20, type } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = Math.min(parseInt(limit), 50);
  
  let activity = [];
  let total = 0;
  
  if (!type || type === 'all' || type === 'submissions') {
    // Get submissions
    const [submissions, submissionsCount] = await Promise.all([
      Submission.find({ user: userId })
        .populate('problem', 'title slug difficulty')
        .select('verdict runtime language createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Submission.countDocuments({ user: userId })
    ]);
    
    activity = submissions.map(sub => ({
      type: 'submission',
      data: sub,
      timestamp: sub.createdAt
    }));
    
    total = submissionsCount;
  }
  
  // Note: For other activity types (bookmarks, etc.), you'd add more queries here
  
  res.status(200).json(
    ApiResponse.paginated(
      { activity },
      {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      'User activity fetched successfully'
    )
  );
});

// @desc    Get solved problems
// @route   GET /api/v1/users/me/solved
// @access  Private
export const getSolvedProblems = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId)
    .select('solvedProblems attemptedProblems');

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const solvedIds = user.solvedProblems?.map(sp => 
    sp.problem ? sp.problem.toString() : null
  ).filter(Boolean) || [];

  const attemptedIds = user.attemptedProblems?.map(ap => 
    ap.problem ? ap.problem.toString() : null
  ).filter(Boolean) || [];

  res.status(200).json(
    ApiResponse.success(
      {
        solvedProblems: solvedIds,
        attemptedProblems: attemptedIds,
        totalSolved: solvedIds.length,
        totalAttempted: attemptedIds.length
      },
      'Solved problems fetched successfully'
    )
  );
});

// @desc    Get user's attempted but unsolved problems
// @route   GET /api/v1/users/:userId/attempted
// @access  Private (only self)
export const getAttemptedProblems = asyncHandler(async (req, res) => {
  // Route is /me/attempted — no :userId param. Always uses the authenticated user.
  const userId = req.params.userId || req.user._id.toString();

  if (userId !== req.user._id.toString()) {
    throw ApiError.forbidden('You can only view your own attempted problems');
  }

  const user = await User.findById(userId).populate({
    path: 'attemptedProblems.problem',
    select: 'title slug difficulty tags metadata.acceptanceRate'
  });
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  const attemptedUnsolved = user.attemptedProblems
    .filter(ap => !ap.solved)
    .map(ap => ({
      problem: ap.problem,
      attemptsCount: ap.attemptsCount,
      lastAttempt: ap.lastAttempt
    }));
  
  res.status(200).json(
    ApiResponse.success(
      { attemptedProblems: attemptedUnsolved },
      'Attempted problems fetched successfully'
    )
  );
});

// @desc    Get user bookmarks
// @route   GET /api/v1/users/me/bookmarks
// @access  Private
export const getBookmarks = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId)
    .select('bookmarks')
    .populate({
      path: 'bookmarks',
      select: 'title slug difficulty tags metadata.acceptanceRate'
    });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  res.status(200).json(
    ApiResponse.success(
      { 
        bookmarks: user.bookmarks || [],
        count: user.bookmarks?.length || 0
      },
      'Bookmarks fetched successfully'
    )
  );
});

// @desc    Toggle bookmark
// @route   POST /api/v1/users/bookmarks/:problemId
// @access  Private
export const toggleBookmark = asyncHandler(async (req, res) => {
  const { problemId } = req.params;
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const bookmarkIndex = user.bookmarks.findIndex(
    id => id.toString() === problemId
  );

  let message;
  if (bookmarkIndex > -1) {
    user.bookmarks.splice(bookmarkIndex, 1);
    message = 'Bookmark removed';
  } else {
    user.bookmarks.push(problemId);
    message = 'Bookmark added';
  }

  await user.save();

  res.status(200).json(
    ApiResponse.success(
      { 
        bookmarks: user.bookmarks,
        isBookmarked: bookmarkIndex === -1
      },
      message
    )
  );
});

// @desc    Get leaderboard
// @route   GET /api/v1/users/leaderboard
// @access  Public
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, timeframe = 'all' } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = Math.min(parseInt(limit), 100);
  
  // Handle different timeframes
  let matchStage = { isActive: true };
  
  if (timeframe === 'weekly') {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Get users with recent activity
    const activeUsers = await Submission.distinct('user', {
      createdAt: { $gte: oneWeekAgo }
    });
    
    matchStage._id = { $in: activeUsers };
  } else if (timeframe === 'monthly') {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const activeUsers = await Submission.distinct('user', {
      createdAt: { $gte: oneMonthAgo }
    });
    
    matchStage._id = { $in: activeUsers };
  }
  
  const [leaderboard, total] = await Promise.all([
    User.aggregate([
      { $match: matchStage },
      { $project: {
        username: 1,
        'profile.name': 1,
        'profile.avatar': 1,
        'profile.country': 1,
        'stats.totalProblemsSolved': 1,
        'stats.easySolved': 1,
        'stats.mediumSolved': 1,
        'stats.hardSolved': 1,
        'stats.score': 1,
        'stats.streak': 1,
        'stats.acceptanceRate': 1,
        'stats.totalSubmissions': 1,
        'stats.acceptedSubmissions': 1,
        rank: { $add: [{ $indexOfArray: ["$stats.score", "$stats.score"] }, 1] }
      }},
      { $sort: { 'stats.score': -1 } },
      { $skip: skip },
      { $limit: limitNum }
    ]),
    User.countDocuments(matchStage)
  ]);
  
  // Calculate ranks
  leaderboard.forEach((user, index) => {
    user.rank = skip + index + 1;
  });
  
  res.status(200).json(
    ApiResponse.paginated(
      { leaderboard },
      {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      'Leaderboard fetched successfully'
    )
  );
});

// @desc    Search users
// @route   GET /api/v1/users/search
// @access  Public
export const searchUsers = asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;
  
  if (!q || q.trim().length < 2) {
    throw ApiError.badRequest('Search query must be at least 2 characters');
  }
  
  const users = await User.find({
    $or: [
      { username: { $regex: q, $options: 'i' } },
      { 'profile.name': { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } }
    ],
    isActive: true
  })
  .select('username profile.name profile.avatar profile.country stats.totalProblemsSolved stats.score')
  .limit(parseInt(limit))
  .lean();
  
  res.status(200).json(
    ApiResponse.success({ users, query: q }, 'Users fetched successfully')
  );
});