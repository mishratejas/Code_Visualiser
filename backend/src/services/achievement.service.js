import { UserAchievement } from '../models/achievement.models.js';
import User from '../models/user.models.js';
import Submission from '../models/submission.models.js';

class AchievementService {
  /**
   * Check and unlock achievements after submission
   */
  async checkSubmissionAchievements(userId, submission) {
    try {
      const user = await User.findById(userId);
      if (!user) return;
      
      const stats = user.stats || {};
      
      // First solve
      if (stats.totalProblemsSolved === 1) {
        await UserAchievement.updateProgress(userId, 'first_solve', 1);
      }
      
      // Problem count milestones
      await UserAchievement.updateProgress(userId, 'problem_10', stats.totalProblemsSolved);
      await UserAchievement.updateProgress(userId, 'problem_50', stats.totalProblemsSolved);
      await UserAchievement.updateProgress(userId, 'problem_100', stats.totalProblemsSolved);
      
      // Speed demon (under 60 seconds)
      if (submission.executionTime && submission.executionTime < 60000) {
        await UserAchievement.updateProgress(userId, 'speed_demon', 1);
      }
      
      // Check if all easy problems solved
      if (stats.easySolved >= 20) { // Assuming 20 is total easy problems
        await UserAchievement.updateProgress(userId, 'all_easy', 1);
      }
      
    } catch (error) {
      console.error('Error checking submission achievements:', error);
    }
  }
  
  /**
   * Check and unlock streak achievements
   */
  async checkStreakAchievements(userId, streakCount) {
    try {
      // Week warrior (7 days)
      if (streakCount >= 7) {
        await UserAchievement.updateProgress(userId, 'streak_7', streakCount);
      }
      
      // Monthly momentum (30 days)
      if (streakCount >= 30) {
        await UserAchievement.updateProgress(userId, 'streak_30', streakCount);
      }
      
      // Unstoppable (100 days)
      if (streakCount >= 100) {
        await UserAchievement.updateProgress(userId, 'streak_100', streakCount);
      }
      
    } catch (error) {
      console.error('Error checking streak achievements:', error);
    }
  }
  
  /**
   * Check and unlock contest achievements
   */
  async checkContestAchievements(userId, contestData) {
    try {
      const { isFirstContest, totalContests, rank, totalParticipants, score, maxScore } = contestData;
      
      // First contest
      if (isFirstContest) {
        await UserAchievement.updateProgress(userId, 'first_contest', 1);
      }
      
      // Contest regular
      await UserAchievement.updateProgress(userId, 'contest_10', totalContests);
      
      // Contest winner (rank 1)
      if (rank === 1) {
        await UserAchievement.updateProgress(userId, 'contest_winner', 1);
      }
      
      // Perfect score
      if (score === maxScore && maxScore > 0) {
        await UserAchievement.updateProgress(userId, 'perfect_score', 1);
      }
      
    } catch (error) {
      console.error('Error checking contest achievements:', error);
    }
  }
  
  /**
   * Initialize achievements for new user
   */
  async initializeUserAchievements(userId) {
    try {
      const { Achievement } = await import('../models/achievement.models.js');
      const achievements = await Achievement.find({ isActive: true });
      
      const userAchievements = achievements.map(achievement => ({
        user: userId,
        achievement: achievement._id,
        progress: 0,
        unlocked: false
      }));
      
      await UserAchievement.insertMany(userAchievements, { ordered: false });
      
    } catch (error) {
      // Ignore duplicate key errors
      if (error.code !== 11000) {
        console.error('Error initializing user achievements:', error);
      }
    }
  }
  
  /**
   * Get achievement progress for user
   */
  async getProgress(userId, achievementKey) {
    try {
      const { Achievement } = await import('../models/achievement.models.js');
      const achievement = await Achievement.findOne({ key: achievementKey });
      
      if (!achievement) return null;
      
      const userAchievement = await UserAchievement.findOne({
        user: userId,
        achievement: achievement._id
      }).populate('achievement');
      
      if (!userAchievement) return { progress: 0, unlocked: false };
      
      return {
        progress: userAchievement.progress,
        unlocked: userAchievement.unlocked,
        percentage: Math.min(100, Math.floor((userAchievement.progress / achievement.requirement) * 100))
      };
      
    } catch (error) {
      console.error('Error getting achievement progress:', error);
      return null;
    }
  }
  
  /**
   * Manually unlock achievement (admin)
   */
  async unlockAchievement(userId, achievementKey) {
    try {
      const { Achievement } = await import('../models/achievement.models.js');
      const achievement = await Achievement.findOne({ key: achievementKey });
      
      if (!achievement) {
        throw new Error('Achievement not found');
      }
      
      let userAchievement = await UserAchievement.findOne({
        user: userId,
        achievement: achievement._id
      }).populate('achievement');
      
      if (!userAchievement) {
        userAchievement = await UserAchievement.create({
          user: userId,
          achievement: achievement._id,
          progress: achievement.requirement
        });
        userAchievement.achievement = achievement;
      }
      
      if (!userAchievement.unlocked) {
        await userAchievement.unlock();
      }
      
      return userAchievement;
      
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      throw error;
    }
  }
  
  /**
   * Get leaderboard by achievement points
   */
  async getAchievementLeaderboard(limit = 100) {
    try {
      const leaderboard = await UserAchievement.aggregate([
        { $match: { unlocked: true } },
        {
          $lookup: {
            from: 'achievements',
            localField: 'achievement',
            foreignField: '_id',
            as: 'achievementData'
          }
        },
        { $unwind: '$achievementData' },
        {
          $group: {
            _id: '$user',
            totalPoints: { $sum: '$achievementData.points' },
            totalUnlocked: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userData'
          }
        },
        { $unwind: '$userData' },
        {
          $project: {
            userId: '$_id',
            username: '$userData.username',
            avatar: '$userData.avatar',
            totalPoints: 1,
            totalUnlocked: 1
          }
        },
        { $sort: { totalPoints: -1, totalUnlocked: -1 } },
        { $limit: limit }
      ]);
      
      return leaderboard;
      
    } catch (error) {
      console.error('Error getting achievement leaderboard:', error);
      return [];
    }
  }
}

export default new AchievementService();