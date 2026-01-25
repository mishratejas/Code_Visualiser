import User from '../models/user.models.js';
import Submission from '../models/submission.models.js';
import Problem from '../models/problem.models.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import mongoose from 'mongoose';

// @desc    Get user profile by ID or username
// @route   GET /api/v1/users/:identifier
// @access  Public (with limited info) / Private (full info for self)
export const getUserProfile = asyncHandler(async (req, res) => {
  const { identifier } = req.params;
  
  console.log('🔍 Getting user profile for:', identifier);
  
  // Determine if identifier is ObjectId or username
  const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
  const query = isObjectId ? { _id: identifier } : { username: identifier };
  
  console.log('Query:', query);
  
  // Select fields based on who's viewing
  const isSelfViewing = req.user && (
    (isObjectId && req.user._id.toString() === identifier) ||
    (!isObjectId && req.user?.username === identifier)
  );
  
  const selectFields = isSelfViewing 
    ? '-password -security.twoFactorSecret'
    : 'username profile.name profile.avatar profile.bio profile.country profile.university profile.github profile.linkedin profile.website stats role isProfileComplete createdAt';
  
  console.log('Select fields:', selectFields);
  
  const user = await User.findOne(query).select(selectFields);
  
  if (!user) {
    console.log('❌ User not found:', identifier);
    throw ApiError.notFound('User not found');
  }
  
  console.log('✅ Found user:', user.username);
  
  // Get user's recent activity
  const recentSubmissions = await Submission.find({ user: user._id })
    .populate('problem', 'title slug difficulty')
    .select('verdict runtime language createdAt')
    .sort({ createdAt: -1 })
    .limit(5);
  
  // Get solved problems count by difficulty
  const solvedStats = await Submission.aggregate([
    { $match: { 
      user: user._id, 
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
      _id: '$problem.difficulty',
      count: { $addToSet: '$problem._id' }
    }},
    { $project: {
      difficulty: '$_id',
      count: { $size: '$count' },
      _id: 0
    }}
  ]);
  
  // Prepare response - FIXED: Use safe object handling
  const response = {
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      profile: user.profile || {},
      stats: user.stats || {},
      role: user.role,
      isProfileComplete: user.isProfileComplete,
      createdAt: user.createdAt
    },
    stats: {
      recentSubmissions,
      solvedByDifficulty: solvedStats.reduce((acc, curr) => {
        acc[curr.difficulty] = curr.count;
        return acc;
      }, { easy: 0, medium: 0, hard: 0 })
    }
  };
  
  // Add additional info if viewing own profile
  if (isSelfViewing) {
    // Get bookmarked problems
    const bookmarks = await Problem.find({ _id: { $in: user.bookmarks || [] } })
      .select('title slug difficulty')
      .limit(10);
    
    // Get attempted but unsolved problems
    const attemptedUnsolved = await Problem.find({ 
      _id: { 
        $in: (user.attemptedProblems || [])
          .filter(ap => !ap.solved)
          .map(ap => ap.problem)
      }
    })
    .select('title slug difficulty')
    .limit(10);
    
    response.additionalInfo = {
      bookmarks,
      attemptedUnsolved,
      preferences: user.preferences || {},
      security: {
        twoFactorEnabled: user.security?.twoFactorEnabled || false,
        lastLogin: user.security?.lastLogin || null
      }
    };
  }
  
  console.log('✅ Sending user profile response');
  
  res.status(200).json(
    ApiResponse.success(response, 'User profile fetched successfully')
  );
});

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { 
    name, 
    bio, 
    country, 
    university, 
    graduationYear,
    github,
    linkedin,
    website,
    skills 
  } = req.body;
  
  const updateData = {};
  
  // Build update object
  if (name !== undefined) updateData['profile.name'] = name;
  if (bio !== undefined) updateData['profile.bio'] = bio;
  if (country !== undefined) updateData['profile.country'] = country;
  if (university !== undefined) updateData['profile.university'] = university;
  if (graduationYear !== undefined) updateData['profile.graduationYear'] = graduationYear;
  if (github !== undefined) updateData['profile.github'] = github;
  if (linkedin !== undefined) updateData['profile.linkedin'] = linkedin;
  if (website !== undefined) updateData['profile.website'] = website;
  
  // Handle skills update
  if (skills && Array.isArray(skills)) {
    updateData['profile.skills'] = skills.map(skill => ({
      name: skill.name,
      level: skill.level || 'intermediate'
    }));
  }
  
  // Mark profile as complete if enough info
  const requiredFields = ['profile.name', 'profile.bio', 'profile.country'];
  const hasRequiredFields = requiredFields.every(field => {
    const keys = field.split('.');
    let value = updateData;
    keys.forEach(key => {
      if (value && typeof value === 'object') {
        value = value[key];
      }
    });
    return value !== undefined && value !== '';
  });
  
  if (hasRequiredFields) {
    updateData.isProfileComplete = true;
  }
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password -security.twoFactorSecret');
  
  res.status(200).json(
    ApiResponse.success({ user }, 'Profile updated successfully')
  );
});

// @desc    Update user preferences
// @route   PUT /api/v1/users/preferences
// @access  Private
export const updateUserPreferences = asyncHandler(async (req, res) => {
  const { 
    theme,
    editorTheme,
    editorFontSize,
    defaultLanguage,
    enableSyntaxHighlighting,
    showLineNumbers,
    tabSize,
    autoSave,
    notifications 
  } = req.body;
  
  const updateData = {};
  
  if (theme !== undefined) updateData['preferences.theme'] = theme;
  if (editorTheme !== undefined) updateData['preferences.editorTheme'] = editorTheme;
  if (editorFontSize !== undefined) updateData['preferences.editorFontSize'] = editorFontSize;
  if (defaultLanguage !== undefined) updateData['preferences.defaultLanguage'] = defaultLanguage;
  if (enableSyntaxHighlighting !== undefined) updateData['preferences.enableSyntaxHighlighting'] = enableSyntaxHighlighting;
  if (showLineNumbers !== undefined) updateData['preferences.showLineNumbers'] = showLineNumbers;
  if (tabSize !== undefined) updateData['preferences.tabSize'] = tabSize;
  if (autoSave !== undefined) updateData['preferences.autoSave'] = autoSave;
  
  if (notifications) {
    if (notifications.email !== undefined) updateData['preferences.notifications.email'] = notifications.email;
    if (notifications.push !== undefined) updateData['preferences.notifications.push'] = notifications.push;
    if (notifications.submissionUpdates !== undefined) updateData['preferences.notifications.submissionUpdates'] = notifications.submissionUpdates;
    if (notifications.contestReminders !== undefined) updateData['preferences.notifications.contestReminders'] = notifications.contestReminders;
  }
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true }
  ).select('-password -security.twoFactorSecret');
  
  res.status(200).json(
    ApiResponse.success({ user }, 'Preferences updated successfully')
  );
});

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

// @desc    Get user's solved problems
// @route   GET /api/v1/users/:userId/solved
// @access  Public
export const getSolvedProblems = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { difficulty, tags, page = 1, limit = 20 } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = Math.min(parseInt(limit), 50);
  
  // Get accepted submissions
  const matchStage = { 
    user: mongoose.Types.ObjectId(userId),
    verdict: 'accepted'
  };
  
  const aggregation = [
    { $match: matchStage },
    { $group: {
      _id: '$problem',
      firstSolved: { $min: '$createdAt' },
      bestRuntime: { $min: '$runtime' },
      submissionCount: { $sum: 1 }
    }},
    { $lookup: {
      from: 'problems',
      localField: '_id',
      foreignField: '_id',
      as: 'problem'
    }},
    { $unwind: '$problem' }
  ];
  
  // Apply filters
  if (difficulty) {
    aggregation.push({ $match: { 'problem.difficulty': difficulty } });
  }
  
  if (tags) {
    const tagArray = tags.split(',');
    aggregation.push({ $match: { 'problem.tags': { $all: tagArray } } });
  }
  
  // Continue aggregation
  aggregation.push(
    { $sort: { firstSolved: -1 } },
    { $skip: skip },
    { $limit: limitNum },
    { $project: {
      problem: {
        _id: '$problem._id',
        title: '$problem.title',
        slug: '$problem.slug',
        difficulty: '$problem.difficulty',
        tags: '$problem.tags'
      },
      firstSolved: 1,
      bestRuntime: 1,
      submissionCount: 1
    }}
  );
  
  const solvedProblems = await Submission.aggregate(aggregation);
  
  // Get total count
  const countAggregation = [...aggregation];
  countAggregation.splice(countAggregation.length - 4, 4); // Remove sort, skip, limit, project
  countAggregation.push({ $count: 'total' });
  
  const countResult = await Submission.aggregate(countAggregation);
  const total = countResult[0]?.total || 0;
  
  res.status(200).json(
    ApiResponse.paginated(
      { solvedProblems },
      {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      'Solved problems fetched successfully'
    )
  );
});

// @desc    Get user's attempted but unsolved problems
// @route   GET /api/v1/users/:userId/attempted
// @access  Private (only self)
export const getAttemptedProblems = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  // Check if user is viewing their own data
  if (req.user._id.toString() !== userId) {
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

// @desc    Get user's bookmarks
// @route   GET /api/v1/users/:userId/bookmarks
// @access  Private (only self)
export const getBookmarks = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  // Check if user is viewing their own data
  if (req.user._id.toString() !== userId) {
    throw ApiError.forbidden('You can only view your own bookmarks');
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = Math.min(parseInt(limit), 50);
  
  const user = await User.findById(userId).select('bookmarks');
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  const [bookmarks, total] = await Promise.all([
    Problem.find({ _id: { $in: user.bookmarks } })
      .select('title slug difficulty tags metadata.acceptanceRate')
      .skip(skip)
      .limit(limitNum),
    Problem.countDocuments({ _id: { $in: user.bookmarks } })
  ]);
  
  res.status(200).json(
    ApiResponse.paginated(
      { bookmarks },
      {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      'Bookmarks fetched successfully'
    )
  );
});

// @desc    Toggle bookmark for a problem
// @route   POST /api/v1/users/bookmarks/:problemId
// @access  Private
export const toggleBookmark = asyncHandler(async (req, res) => {
  const { problemId } = req.params;
  
  // Check if problem exists
  const problem = await Problem.findById(problemId);
  if (!problem) {
    throw ApiError.notFound('Problem not found');
  }
  
  const user = await User.findById(req.user._id);
  
  // Toggle bookmark
  await user.toggleBookmark(problemId);
  
  // Update problem bookmark count
  const isBookmarked = user.bookmarks.includes(problemId);
  if (isBookmarked) {
    await problem.addBookmarkCount();
  } else {
    await problem.removeBookmarkCount();
  }
  
  res.status(200).json(
    ApiResponse.success(
      { bookmarked: isBookmarked },
      isBookmarked ? 'Problem bookmarked' : 'Bookmark removed'
    )
  );
});

// @desc    Update user's streak
// @route   POST /api/v1/users/streak/update
// @access  Private
export const updateStreak = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  await user.updateStreak();
  
  res.status(200).json(
    ApiResponse.success(
      { 
        streak: user.stats.streak,
        maxStreak: user.stats.maxStreak,
        lastActiveDate: user.stats.lastActiveDate
      },
      'Streak updated successfully'
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

// @desc    Delete user account
// @route   DELETE /api/v1/users/account
// @access  Private
export const deleteAccount = asyncHandler(async (req, res) => {
  const { confirmPassword } = req.body;
  
  if (!confirmPassword) {
    throw ApiError.badRequest('Please confirm your password');
  }
  
  const user = await User.findById(req.user._id).select('+password');
  
  const isPasswordValid = await user.comparePassword(confirmPassword);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Incorrect password');
  }
  
  // Instead of deleting, deactivate the account
  user.isActive = false;
  user.email = `deleted_${Date.now()}_${user.email}`;
  user.username = `deleted_${Date.now()}_${user.username}`;
  await user.save();
  
  // Clear cookie
  res.clearCookie('token');
  
  res.status(200).json(
    ApiResponse.success(null, 'Account deactivated successfully')
  );
});