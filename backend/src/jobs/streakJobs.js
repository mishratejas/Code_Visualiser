import cron from 'node-cron';
import streakService from '../services/streak.service.js';
import logger from '../config/logger.js';

/**
 * Daily streak checker
 * Runs at midnight every day to check and update streaks
 */
export const streakCheckerJob = cron.schedule('0 0 * * *', async () => {
  try {
    logger.info('Starting daily streak check...');
    
    const result = await streakService.checkAllStreaks();
    
    logger.info(`Streak check completed. Processed ${result.processed} users.`);
  } catch (error) {
    logger.error('Error in streak checker job:', error);
  }
}, {
  scheduled: true,
  timezone: "UTC"
});

/**
 * Start all streak jobs
 */
export const startStreakJobs = () => {
  logger.info('Starting streak checker job (runs daily at midnight UTC)...');
  streakCheckerJob.start();
};

/**
 * Stop all streak jobs
 */
export const stopStreakJobs = () => {
  logger.info('Stopping streak checker job...');
  streakCheckerJob.stop();
};

export default {
  start: startStreakJobs,
  stop: stopStreakJobs
};