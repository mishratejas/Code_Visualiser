import { sequelize } from '../../db/postgres/index.js';

export const defineAssociations = async () => {
  try {
    const Contest = (await import('./Contest.models.js')).default;
    const User = (await import('./User.models.js')).default;
    const ContestParticipant = (await import('./ContestParticipant.models.js')).default;
    const ContestSubmission = (await import('./ContestSubmission.models.js')).default;
    const ContestRatingHistory = (await import('./ContestRatingHistory.models.js')).default;
    const ContestRejudge = (await import('./Contestrejudge.models.js')).default;
    
    console.log('📦 Setting up model associations...');
    
    // ❌ REMOVED ALL Contest-User associations since users are in MongoDB!
    
    // Contest has many Participants
    Contest.hasMany(ContestParticipant, {
      foreignKey: 'contest_id',
      as: 'participants',
      onDelete: 'CASCADE'
    });
    
    ContestParticipant.belongsTo(Contest, {
      foreignKey: 'contest_id',
      as: 'contest',
      onDelete: 'CASCADE'
    });
    
    // Contest has many Submissions
    Contest.hasMany(ContestSubmission, {
      foreignKey: 'contest_id',
      as: 'submissions',
      onDelete: 'CASCADE'
    });
    
    ContestSubmission.belongsTo(Contest, {
      foreignKey: 'contest_id',
      as: 'contest',
      onDelete: 'CASCADE'
    });

    // L6 fix — Contest has many rating history rows (one per participant
    // whose rating was recomputed after this contest)
    Contest.hasMany(ContestRatingHistory, {
      foreignKey: 'contest_id',
      as: 'ratingHistory',
      onDelete: 'CASCADE'
    });

    ContestRatingHistory.belongsTo(Contest, {
      foreignKey: 'contest_id',
      as: 'contest',
      onDelete: 'CASCADE'
    });

    // L7 fix — Contest has many rejudge operations (history of every
    // rejudge ever triggered for this contest, not just the latest)
    Contest.hasMany(ContestRejudge, {
      foreignKey: 'contest_id',
      as: 'rejudges',
      onDelete: 'CASCADE'
    });

    ContestRejudge.belongsTo(Contest, {
      foreignKey: 'contest_id',
      as: 'contest',
      onDelete: 'CASCADE'
    });
    
    console.log('✅ All PostgreSQL model associations defined successfully');
    console.log('   - Contest <-> Participants');
    console.log('   - Contest <-> Submissions');
    console.log('   - Contest <-> RatingHistory');
    console.log('   - Contest <-> Rejudges');
    console.log('   ℹ️  Note: Contest creator and users are in MongoDB');
    
    return true;
  } catch (error) {
    console.error('❌ Error defining associations:', error);
    return false;
  }
};

export default defineAssociations;