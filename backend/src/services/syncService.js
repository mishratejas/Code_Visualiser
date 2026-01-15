import User from '../models/postgres/User.models.js';
import Contest from '../models/postgres/Contest.models.js';
import ContestParticipant from '../models/postgres/ContestParticipant.models.js';

class SyncService {
  // Sync MongoDB User to PostgreSQL
  static async syncUser(mongoUser) {
    try {
      const [user, created] = await User.upsert({
        mongo_id: mongoUser._id.toString(),
        username: mongoUser.username,
        email: mongoUser.email,
        role: mongoUser.role,
        name: mongoUser.profile?.name,
        avatar_url: mongoUser.profile?.avatar,
        country_code: mongoUser.profile?.country,
        score: mongoUser.stats?.score || 0,
        rank: mongoUser.stats?.rank || 0,
        total_problems_solved: mongoUser.stats?.totalProblemsSolved || 0,
        easy_solved: mongoUser.stats?.easySolved || 0,
        medium_solved: mongoUser.stats?.mediumSolved || 0,
        hard_solved: mongoUser.stats?.hardSolved || 0,
        streak: mongoUser.stats?.streak || 0,
        max_streak: mongoUser.stats?.maxStreak || 0,
        last_active_date: mongoUser.stats?.lastActiveDate,
        is_active: mongoUser.isActive !== false
      });

      console.log(`User ${created ? 'created' : 'updated'} in PostgreSQL: ${mongoUser.username}`);
      return user;
    } catch (error) {
      console.error('Error syncing user to PostgreSQL:', error);
      throw error;
    }
  }

  // Sync when user solves a problem
  static async syncUserStats(mongoUserId, stats) {
    try {
      const user = await User.findOne({ where: { mongo_id: mongoUserId } });
      if (!user) return;

      await user.update({
        total_problems_solved: stats.totalProblemsSolved || 0,
        easy_solved: stats.easySolved || 0,
        medium_solved: stats.mediumSolved || 0,
        hard_solved: stats.hardSolved || 0,
        score: stats.score || 0,
        streak: stats.streak || 0,
        max_streak: stats.maxStreak || 0,
        last_active_date: stats.lastActiveDate
      });

      console.log(`User stats synced for: ${user.username}`);
    } catch (error) {
      console.error('Error syncing user stats:', error);
    }
  }

  // Get leaderboard from PostgreSQL (FAST!)
  static async getLeaderboard(limit = 100, offset = 0) {
    try {
      const leaderboard = await User.findAll({
        where: { is_active: true },
        attributes: [
          'id',
          'username',
          'name',
          'avatar_url',
          'country_code',
          'score',
          'total_problems_solved',
          'easy_solved',
          'medium_solved',
          'hard_solved',
          'streak',
          'rank'
        ],
        order: [['score', 'DESC']],
        limit,
        offset
      });

      return leaderboard;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  // Update ranks periodically
  static async updateRanks() {
    try {
      // Using PostgreSQL window function for ranking
      const result = await User.sequelize.query(`
        WITH ranked_users AS (
          SELECT 
            id,
            ROW_NUMBER() OVER (ORDER BY score DESC, total_problems_solved DESC) as new_rank
          FROM users
          WHERE is_active = true
        )
        UPDATE users u
        SET rank = r.new_rank,
            updated_at = NOW()
        FROM ranked_users r
        WHERE u.id = r.id
        RETURNING u.id, u.username, u.rank
      `);

      console.log(`Ranks updated for ${result[1].rowCount} users`);
      return result[0];
    } catch (error) {
      console.error('Error updating ranks:', error);
      throw error;
    }
  }

  // Sync contest participant
  static async syncContestParticipant(contestId, userId, score = 0) {
    try {
      const [participant, created] = await ContestParticipant.upsert({
        contest_id: contestId,
        user_id: userId,
        score,
        last_submission_at: new Date()
      }, {
        conflictFields: ['contest_id', 'user_id']
      });

      console.log(`Contest participant ${created ? 'added' : 'updated'}`);
      return participant;
    } catch (error) {
      console.error('Error syncing contest participant:', error);
      throw error;
    }
  }

  // Get contest leaderboard
  static async getContestLeaderboard(contestId, limit = 100) {
    try {
      const leaderboard = await ContestParticipant.findAll({
        where: { contest_id: contestId },
        include: [{
          model: User,
          attributes: ['id', 'username', 'name', 'avatar_url', 'country_code']
        }],
        order: [['score', 'DESC'], ['total_time', 'ASC']],
        limit
      });

      return leaderboard;
    } catch (error) {
      console.error('Error fetching contest leaderboard:', error);
      throw error;
    }
  }
}

export default SyncService;