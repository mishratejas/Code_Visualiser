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
    const { type, contestTitle, contestId, startTime, delta, newRating, rank, totalParticipants } = contestData;

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
      case 'rating_updated':
        title = delta > 0 ? '📈 Rating Increased!' : '📉 Rating Changed';
        message = delta > 0
          ? `+${delta} rating points! New rating: ${newRating} (Rank #${rank}/${totalParticipants})`
          : `${delta} rating points. New rating: ${newRating} (Rank #${rank}/${totalParticipants})`;
        break;
      case 'plagiarism_flagged':
        title = '⚠️ Submission Under Review';
        message = `Your submission in a recent contest has been flagged for similarity review. An admin will review it shortly.`;
        break;
      case 'plagiarism_confirmed':
        title = '🚫 Contest Disqualification';
        message = `You have been disqualified from a recent contest due to plagiarism. Contact support if you believe this is an error.`;
        break;
      case 'plagiarism_cleared':
        title = '✅ Review Cleared';
        message = `Your submission has been reviewed and cleared. No action taken.`;
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
      sendEmail: type === 'starting_soon',
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

  /**
   * Notify group owner/admins about a new join request
   */
  async notifyGroupJoinRequest(adminUserIds, requesterUsername, groupName, groupId) {
    const notifications = adminUserIds.map(adminId => ({
      user: adminId,
      type: 'system',
      title: '👥 New Join Request',
      message: `${requesterUsername} wants to join "${groupName}". Review their request.`,
      icon: '👥',
      link: `/groups/${groupId}`,
      metadata: { groupId, requesterUsername },
      priority: 'medium'
    }));
    try {
      await this.bulkCreateNotifications(notifications);
    } catch (err) {
      console.error('notifyGroupJoinRequest error:', err.message);
    }
  }

  /**
   * Notify user that their group join request was approved
   */
  async notifyGroupJoinApproved(userId, groupName, groupId) {
    return this.createNotification({
      user: userId,
      type: 'system',
      title: '✅ Join Request Approved!',
      message: `Your request to join "${groupName}" was approved. Welcome to the group!`,
      icon: '🎉',
      link: `/groups/${groupId}`,
      metadata: { groupId },
      priority: 'high'
    });
  }

  /**
   * Notify user that their group join request was rejected
   */
  async notifyGroupJoinRejected(userId, groupName) {
    return this.createNotification({
      user: userId,
      type: 'system',
      title: '❌ Join Request Declined',
      message: `Your request to join "${groupName}" was not approved.`,
      icon: '❌',
      link: '/groups',
      priority: 'medium'
    });
  }
}

export default new NotificationService();