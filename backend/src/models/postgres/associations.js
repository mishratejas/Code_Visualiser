import { sequelize } from '../../db/postgres/index.js';

export const defineAssociations = async () => {
  try {
    const Contest = (await import('./Contest.models.js')).default;
    const User = (await import('./User.models.js')).default;
    const ContestParticipant = (await import('./ContestParticipant.models.js')).default;
    const ContestSubmission = (await import('./ContestSubmission.models.js')).default;
    
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
    
    console.log('✅ All PostgreSQL model associations defined successfully');
    console.log('   - Contest <-> Participants');
    console.log('   - Contest <-> Submissions');
    console.log('   ℹ️  Note: Contest creator and users are in MongoDB');
    
    return true;
  } catch (error) {
    console.error('❌ Error defining associations:', error);
    return false;
  }
};

export default defineAssociations;
