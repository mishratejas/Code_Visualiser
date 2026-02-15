import User from '../models/user.models.js';
import achievementService from './achievement.service.js';
import notificationService from './notification.service.js';

class StreakService {
  /**
   * Update user streak on activity
   */
  async updateStreak(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastActiveDate = user.streak?.lastActiveDate ? 
        new Date(user.streak.lastActiveDate) : null;
      
      if (lastActiveDate) {
        lastActiveDate.setHours(0, 0, 0, 0);
      }
      
      // Initialize streak if doesn't exist
      if (!user.streak) {
        user.streak = {
          current: 1,
          longest: 1,
          lastActiveDate: today,
          freezeAvailable: 0
        };
      } else if (!lastActiveDate || lastActiveDate < today) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastActiveDate && lastActiveDate.getTime() === yesterday.getTime()) {
          // Consecutive day - increment streak
          user.streak.current += 1;
          user.streak.longest = Math.max(user.streak.longest, user.streak.current);
          
          // Check for milestone
          const isMilestone = [7, 30, 50, 100, 365].includes(user.streak.current);
          
          // Notify user
          await notificationService.notifyStreak(userId, {
            currentStreak: user.streak.current,
            milestone: isMilestone
          });
          
          // Check streak achievements
          await achievementService.checkStreakAchievements(userId, user.streak.current);
          
        } else if (!lastActiveDate || lastActiveDate < yesterday) {
          // Streak broken - check if freeze available
          if (user.streak.freezeAvailable > 0) {
            // Use freeze
            user.streak.freezeAvailable -= 1;
            await notificationService.notifySystem(userId, {
              title: '❄️ Streak Freeze Used',
              message: `Your streak was saved! ${user.streak.freezeAvailable} freezes remaining.`,
              icon: '❄️',
              link: '/profile'
            });
          } else {
            // Streak broken
            const brokenStreak = user.streak.current;
            user.streak.current = 1;
            
            if (brokenStreak > 3) {
              await notificationService.notifySystem(userId, {
                title: '💔 Streak Broken',
                message: `Your ${brokenStreak} day streak has ended. Start a new one today!`,
                icon: '💔',
                link: '/profile'
              });
            }
          }
        }
        
        user.streak.lastActiveDate = today;
      }
      
      await user.save();
      return user.streak;
      
    } catch (error) {
      console.error('Error updating streak:', error);
      return null;
    }
  }
  
  /**
   * Check and update all user streaks (daily cron job)
   */
  async checkAllStreaks() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find users whose last active date was before yesterday
      const users = await User.find({
        'streak.current': { $gt: 0 },
        'streak.lastActiveDate': { $lt: yesterday }
      });
      
      console.log(`Checking streaks for ${users.length} users...`);
      
      for (const user of users) {
        const lastActiveDate = new Date(user.streak.lastActiveDate);
        lastActiveDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((today - lastActiveDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Yesterday - check if freeze available
          if (user.streak.freezeAvailable > 0) {
            user.streak.freezeAvailable -= 1;
            await notificationService.notifySystem(user._id, {
              title: '❄️ Streak Freeze Auto-Applied',
              message: `Your streak was automatically saved! ${user.streak.freezeAvailable} freezes remaining.`,
              icon: '❄️',
              link: '/profile'
            });
          } else {
            // Break streak
            const brokenStreak = user.streak.current;
            user.streak.current = 0;
            
            if (brokenStreak > 3) {
              await notificationService.notifySystem(user._id, {
                title: '💔 Streak Broken',
                message: `Your ${brokenStreak} day streak has ended. Come back to start a new one!`,
                icon: '💔',
                link: '/problems',
                priority: 'high'
              });
            }
          }
        } else if (daysDiff > 1) {
          // More than 1 day - break streak regardless
          user.streak.current = 0;
        }
        
        await user.save();
      }
      
      console.log('Streak check completed');
      return { processed: users.length };
      
    } catch (error) {
      console.error('Error checking all streaks:', error);
      throw error;
    }
  }
  
  /**
   * Use streak freeze
   */
  async useFreeze(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      if (!user.streak || user.streak.freezeAvailable <= 0) {
        throw new Error('No freezes available');
      }
      
      user.streak.freezeAvailable -= 1;
      await user.save();
      
      return user.streak;
      
    } catch (error) {
      console.error('Error using freeze:', error);
      throw error;
    }
  }
  
  /**
   * Award streak freeze (premium feature or achievement reward)
   */
  async awardFreeze(userId, count = 1) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      if (!user.streak) {
        user.streak = {
          current: 0,
          longest: 0,
          lastActiveDate: null,
          freezeAvailable: 0
        };
      }
      
      user.streak.freezeAvailable = (user.streak.freezeAvailable || 0) + count;
      await user.save();
      
      await notificationService.notifySystem(userId, {
        title: '🎁 Streak Freeze Awarded',
        message: `You received ${count} streak freeze${count > 1 ? 's' : ''}!`,
        icon: '🎁',
        link: '/profile'
      });
      
      return user.streak;
      
    } catch (error) {
      console.error('Error awarding freeze:', error);
      throw error;
    }
  }
  
  /**
   * Get user streak info
   */
  async getStreak(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.streak) {
        return {
          current: 0,
          longest: 0,
          lastActiveDate: null,
          freezeAvailable: 0
        };
      }
      
      return user.streak;
      
    } catch (error) {
      console.error('Error getting streak:', error);
      return null;
    }
  }
  
  /**
   * Get streak leaderboard
   */
  async getStreakLeaderboard(limit = 100) {
    try {
      const users = await User.find({
        'streak.current': { $gt: 0 }
      })
      .select('username avatar streak')
      .sort({ 'streak.current': -1, 'streak.longest': -1 })
      .limit(limit)
      .lean();
      
      return users.map((user, index) => ({
        rank: index + 1,
        userId: user._id,
        username: user.username,
        avatar: user.avatar,
        currentStreak: user.streak.current,
        longestStreak: user.streak.longest
      }));
      
    } catch (error) {
      console.error('Error getting streak leaderboard:', error);
      return [];
    }
  }
  
  /**
   * Get streak calendar data for user (last 90 days)
   */
  async getStreakCalendar(userId, days = 90) {
    try {
      const user = await User.findById(userId);
      if (!user) return [];
      
      // This would require storing daily activity - simplified version
      // In production, you'd want a separate DailyActivity collection
      const today = new Date();
      const calendar = [];
      
      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        // Simplified - in production, check actual submissions/activity
        const lastActive = user.streak?.lastActiveDate ? 
          new Date(user.streak.lastActiveDate) : null;
        
        calendar.push({
          date: date.toISOString().split('T')[0],
          active: lastActive && date <= lastActive,
          count: 0 // Would be actual submission count
        });
      }
      
      return calendar.reverse();
      
    } catch (error) {
      console.error('Error getting streak calendar:', error);
      return [];
    }
  }
}

export default new StreakService();