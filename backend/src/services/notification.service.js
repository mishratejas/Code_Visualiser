import Notification from '../models/notification.models.js';
import emailService from './emailService.js';

class NotificationService {
  /**
   * Create a notification
   */
  async createNotification(data) {
    try {
      const notification = await Notification.createNotification(data);
      
      // Send email notification if enabled
      if (data.sendEmail && data.user.emailPreferences?.[data.type]) {
        await this.sendEmailNotification(data.user, notification);
      }
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
  
  /**
   * Send email notification
   */
  async sendEmailNotification(user, notification) {
    try {
      const emailData = {
        to: user.email,
        subject: notification.title,
        template: notification.type,
        data: {
          username: user.username,
          message: notification.message,
          link: notification.link,
          ...notification.metadata
        }
      };
      
      await emailService.sendEmail(emailData);
    } catch (error) {
      console.error('Error sending email notification:', error);
      // Don't throw - email failure shouldn't break notification creation
    }
  }
  
  /**
   * Notify on submission result
   */
  async notifySubmission(userId, submissionData) {
    const { status, problemTitle, executionTime, testCasesPassed, totalTestCases } = submissionData;
    
    let title, message, icon;
    
    if (status === 'accepted') {
      title = '✅ Solution Accepted!';
      message = `Your solution to "${problemTitle}" was accepted! Passed all ${totalTestCases} test cases in ${executionTime}ms.`;
      icon = '✅';
    } else if (status === 'wrong_answer') {
      title = '❌ Wrong Answer';
      message = `Your solution to "${problemTitle}" failed. Passed ${testCasesPassed}/${totalTestCases} test cases.`;
      icon = '❌';
    } else {
      title = `⚠️ ${status.replace('_', ' ').toUpperCase()}`;
      message = `Your submission to "${problemTitle}" resulted in ${status}.`;
      icon = '⚠️';
    }
    
    return this.createNotification({
      user: userId,
      type: 'submission',
      title,
      message,
      icon,
      link: `/submissions/${submissionData.submissionId}`,
      metadata: submissionData
    });
  }
  
  /**
   * Notify on achievement unlock
   */
  async notifyAchievement(userId, achievementData) {
    const { title, description, points, icon } = achievementData;
    
    return this.createNotification({
      user: userId,
      type: 'achievement',
      title: '🏆 Achievement Unlocked!',
      message: `${title} - ${description} (+${points} points)`,
      icon: icon || '🏆',
      link: '/achievements',
      metadata: achievementData,
      sendEmail: true
    });
  }
  
  /**
   * Notify about contest
   */
  async notifyContest(userId, contestData) {
    const { type, contestTitle, contestId, startTime } = contestData;
    
    let title, message;
    
    switch (type) {
      case 'starting_soon':
        title = '⏰ Contest Starting Soon';
        message = `"${contestTitle}" starts in 1 hour!`;
        break;
      case 'started':
        title = '🏁 Contest Started';
        message = `"${contestTitle}" has started. Good luck!`;
        break;
      case 'ending_soon':
        title = '⏰ Contest Ending Soon';
        message = `"${contestTitle}" ends in 30 minutes!`;
        break;
      case 'ended':
        title = '🏁 Contest Ended';
        message = `"${contestTitle}" has ended. Check the leaderboard!`;
        break;
      default:
        title = '📢 Contest Update';
        message = `Update for "${contestTitle}"`;
    }
    
    return this.createNotification({
      user: userId,
      type: 'contest',
      title,
      message,
      icon: '🏆',
      link: `/contests/${contestId}`,
      metadata: contestData,
      sendEmail: type === 'starting_soon'
    });
  }
  
  /**
   * Notify about interview
   */
  async notifyInterview(userId, interviewData) {
    const { type, score, feedback } = interviewData;
    
    let title, message;
    
    if (type === 'completed') {
      title = '✅ Interview Completed';
      message = `Your interview session has been completed. Score: ${score}%`;
    } else {
      title = '📝 Interview Scheduled';
      message = 'Your interview session is ready to begin.';
    }
    
    return this.createNotification({
      user: userId,
      type: 'interview',
      title,
      message,
      icon: '🎓',
      link: '/interview',
      metadata: interviewData
    });
  }
  
  /**
   * Send system notification
   */
  async notifySystem(userId, data) {
    return this.createNotification({
      user: userId,
      type: 'system',
      title: data.title || '📢 System Notification',
      message: data.message,
      icon: data.icon || '📢',
      link: data.link || null,
      metadata: data.metadata || {},
      priority: data.priority || 'medium'
    });
  }
  
  /**
   * Send streak notification
   */
  async notifyStreak(userId, streakData) {
    const { currentStreak, milestone } = streakData;
    
    let title = '🔥 Streak Updated!';
    let message = `You're on a ${currentStreak} day streak!`;
    
    if (milestone) {
      title = '🔥 Streak Milestone!';
      message = `Congratulations! You've reached a ${currentStreak} day streak!`;
    }
    
    return this.createNotification({
      user: userId,
      type: 'achievement',
      title,
      message,
      icon: '🔥',
      link: '/profile',
      metadata: streakData
    });
  }
  
  /**
   * Bulk create notifications
   */
  async bulkCreateNotifications(notifications) {
    try {
      return await Notification.insertMany(notifications);
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }
  
  /**
   * Delete old notifications (cleanup)
   */
  async cleanupOldNotifications(days = 30) {
    try {
      return await Notification.deleteOldNotifications(days);
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      throw error;
    }
  }
}

export default new NotificationService();