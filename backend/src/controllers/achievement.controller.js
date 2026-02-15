import { Achievement, UserAchievement } from '../models/achievement.models.js';
import User from '../models/user.models.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all achievements
// @route   GET /api/v1/achievements
// @access  Public
export const getAllAchievements = asyncHandler(async (req, res) => {
  const achievements = await Achievement.find({ isActive: true })
    .sort({ category: 1, requirement: 1 })
    .lean();
  
  res.status(200).json(
    new ApiResponse(200, { achievements }, 'Achievements fetched successfully')
  );
});

// @desc    Get user achievements
// @route   GET /api/v1/achievements/user
// @access  Private
export const getUserAchievements = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Get all achievements
  const allAchievements = await Achievement.find({ isActive: true }).lean();
  
  // Get user's achievement progress
  const userAchievements = await UserAchievement.find({ user: userId })
    .populate('achievement')
    .lean();
  
  // Create a map of achievement progress
  const progressMap = new Map();
  userAchievements.forEach(ua => {
    if (ua.achievement) {
      progressMap.set(ua.achievement._id.toString(), {
        progress: ua.progress,
        unlocked: ua.unlocked,
        unlockedAt: ua.unlockedAt,
        percentage: Math.min(100, Math.floor((ua.progress / ua.achievement.requirement) * 100))
      });
    }
  });
  
  // Combine achievements with user progress
  const achievementsWithProgress = allAchievements.map(achievement => {
    const progress = progressMap.get(achievement._id.toString()) || {
      progress: 0,
      unlocked: false,
      unlockedAt: null,
      percentage: 0
    };
    
    return {
      ...achievement,
      ...progress
    };
  });
  
  // Separate unlocked and locked
  const unlocked = achievementsWithProgress.filter(a => a.unlocked);
  const locked = achievementsWithProgress.filter(a => !a.unlocked);
  
  // Calculate stats
  const stats = {
    totalUnlocked: unlocked.length,
    totalAchievements: allAchievements.length,
    totalPoints: unlocked.reduce((sum, a) => sum + a.points, 0),
    completionRate: Math.floor((unlocked.length / allAchievements.length) * 100)
  };
  
  res.status(200).json(
    new ApiResponse(200, {
      unlocked,
      locked,
      stats
    }, 'User achievements fetched successfully')
  );
});

// @desc    Get user achievement stats
// @route   GET /api/v1/achievements/stats
// @access  Private
export const getAchievementStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  const [totalAchievements, userUnlocked] = await Promise.all([
    Achievement.countDocuments({ isActive: true }),
    UserAchievement.find({ user: userId, unlocked: true }).populate('achievement')
  ]);
  
  const totalPoints = userUnlocked.reduce((sum, ua) => sum + (ua.achievement?.points || 0), 0);
  
  // Get recent unlocks
  const recentUnlocks = userUnlocked
    .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
    .slice(0, 5)
    .map(ua => ({
      achievement: ua.achievement,
      unlockedAt: ua.unlockedAt
    }));
  
  // Get category breakdown
  const categoryBreakdown = {};
  userUnlocked.forEach(ua => {
    const category = ua.achievement?.category;
    if (category) {
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    }
  });
  
  res.status(200).json(
    new ApiResponse(200, {
      totalUnlocked: userUnlocked.length,
      totalAchievements,
      totalPoints,
      completionRate: Math.floor((userUnlocked.length / totalAchievements) * 100),
      recentUnlocks,
      categoryBreakdown
    }, 'Achievement stats fetched successfully')
  );
});

// @desc    Create achievement (Admin only)
// @route   POST /api/v1/achievements
// @access  Private/Admin
export const createAchievement = asyncHandler(async (req, res) => {
  const achievement = await Achievement.create(req.body);
  
  res.status(201).json(
    new ApiResponse(201, { achievement }, 'Achievement created successfully')
  );
});

// @desc    Update achievement (Admin only)
// @route   PUT /api/v1/achievements/:id
// @access  Private/Admin
export const updateAchievement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const achievement = await Achievement.findByIdAndUpdate(
    id,
    req.body,
    { new: true, runValidators: true }
  );
  
  if (!achievement) {
    throw ApiError.notFound('Achievement not found');
  }
  
  res.status(200).json(
    new ApiResponse(200, { achievement }, 'Achievement updated successfully')
  );
});

// @desc    Delete achievement (Admin only)
// @route   DELETE /api/v1/achievements/:id
// @access  Private/Admin
export const deleteAchievement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const achievement = await Achievement.findByIdAndDelete(id);
  
  if (!achievement) {
    throw ApiError.notFound('Achievement not found');
  }
  
  // Also delete all user achievements for this achievement
  await UserAchievement.deleteMany({ achievement: id });
  
  res.status(200).json(
    new ApiResponse(200, {}, 'Achievement deleted successfully')
  );
});

// @desc    Seed default achievements
// @route   POST /api/v1/achievements/seed
// @access  Private/Admin
export const seedAchievements = asyncHandler(async (req, res) => {
  // Check if achievements already exist
  const existingCount = await Achievement.countDocuments();
  
  if (existingCount > 0) {
    throw ApiError.badRequest('Achievements already seeded');
  }
  
  const defaultAchievements = [
    // Milestone achievements
    {
      key: 'first_solve',
      title: 'First Steps',
      description: 'Solve your first problem',
      icon: '🎯',
      category: 'milestone',
      points: 10,
      requirement: 1,
      type: 'count',
      color: 'from-green-500 to-emerald-500'
    },
    {
      key: 'problem_10',
      title: 'Getting Started',
      description: 'Solve 10 problems',
      icon: '📚',
      category: 'milestone',
      points: 50,
      requirement: 10,
      type: 'count',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      key: 'problem_50',
      title: 'Problem Solver',
      description: 'Solve 50 problems',
      icon: '🏅',
      category: 'milestone',
      points: 200,
      requirement: 50,
      type: 'count',
      color: 'from-purple-500 to-pink-500'
    },
    {
      key: 'problem_100',
      title: 'Century',
      description: 'Solve 100 problems',
      icon: '💯',
      category: 'milestone',
      points: 500,
      requirement: 100,
      type: 'count',
      color: 'from-yellow-500 to-orange-500'
    },
    
    // Streak achievements
    {
      key: 'streak_7',
      title: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      category: 'streak',
      points: 100,
      requirement: 7,
      type: 'streak',
      color: 'from-orange-500 to-red-500'
    },
    {
      key: 'streak_30',
      title: 'Monthly Momentum',
      description: 'Maintain a 30-day streak',
      icon: '⚡',
      category: 'streak',
      points: 300,
      requirement: 30,
      type: 'streak',
      color: 'from-red-500 to-pink-500'
    },
    {
      key: 'streak_100',
      title: 'Unstoppable',
      description: 'Maintain a 100-day streak',
      icon: '🌟',
      category: 'streak',
      points: 1000,
      requirement: 100,
      type: 'streak',
      color: 'from-purple-500 to-indigo-500'
    },
    
    // Contest achievements
    {
      key: 'first_contest',
      title: 'Contest Debut',
      description: 'Participate in your first contest',
      icon: '🏆',
      category: 'contest',
      points: 50,
      requirement: 1,
      type: 'count',
      color: 'from-yellow-500 to-amber-500'
    },
    {
      key: 'contest_10',
      title: 'Contest Regular',
      description: 'Participate in 10 contests',
      icon: '🎖️',
      category: 'contest',
      points: 200,
      requirement: 10,
      type: 'count',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      key: 'contest_winner',
      title: 'Champion',
      description: 'Win your first contest',
      icon: '👑',
      category: 'contest',
      points: 500,
      requirement: 1,
      type: 'unique',
      color: 'from-yellow-400 to-yellow-600'
    },
    
    // Speed achievements
    {
      key: 'speed_demon',
      title: 'Speed Demon',
      description: 'Solve a problem in under 60 seconds',
      icon: '⚡',
      category: 'speed',
      points: 150,
      requirement: 1,
      type: 'unique',
      color: 'from-cyan-500 to-blue-500'
    },
    
    // Mastery achievements
    {
      key: 'all_easy',
      title: 'Easy Master',
      description: 'Solve all easy problems',
      icon: '🎓',
      category: 'mastery',
      points: 300,
      requirement: 1,
      type: 'unique',
      color: 'from-green-500 to-teal-500'
    },
    {
      key: 'perfect_score',
      title: 'Perfectionist',
      description: 'Get 100% score in a contest',
      icon: '💎',
      category: 'special',
      points: 500,
      requirement: 1,
      type: 'unique',
      color: 'from-pink-500 to-rose-500'
    }
  ];
  
  const achievements = await Achievement.insertMany(defaultAchievements);
  
  res.status(201).json(
    new ApiResponse(201, { count: achievements.length, achievements }, 'Achievements seeded successfully')
  );
});