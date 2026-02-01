import { sequelize } from '../../db/postgres/index.js';

/**
 * Define all Sequelize model associations
 * This file should be imported and called after all models are loaded
 */
export const defineAssociations = async () => {
  try {
    // Lazy import models to avoid circular dependencies
    const Contest = (await import('./Contest.models.js')).default;
    const User = (await import('./User.models.js')).default;
    const ContestParticipant = (await import('./ContestParticipant.models.js')).default;
    const ContestSubmission = (await import('./ContestSubmission.models.js')).default;
    
    console.log('📦 Setting up model associations...');
    
    // ==========================================
    // CONTEST <-> USER ASSOCIATIONS (Creator)
    // ==========================================
    
    // Contest belongs to User (creator)
    Contest.belongsTo(User, {
      foreignKey: 'created_by',
      as: 'creator',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // User has many created Contests
    User.hasMany(Contest, {
      foreignKey: 'created_by',
      as: 'createdContests',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // ==========================================
    // CONTEST <-> PARTICIPANT ASSOCIATIONS
    // ==========================================
    
    // Contest has many Participants
    Contest.hasMany(ContestParticipant, {
      foreignKey: 'contest_id',
      as: 'participants',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    // User has many Participant entries
    User.hasMany(ContestParticipant, {
      foreignKey: 'user_id',
      as: 'contestRegistrations',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    // ContestParticipant belongs to Contest
    ContestParticipant.belongsTo(Contest, {
      foreignKey: 'contest_id',
      as: 'contest',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    // ContestParticipant belongs to User
    ContestParticipant.belongsTo(User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    // Many-to-Many: Contest <-> User through ContestParticipant
    Contest.belongsToMany(User, {
      through: ContestParticipant,
      foreignKey: 'contest_id',
      otherKey: 'user_id',
      as: 'registeredUsers'
    });
    
    User.belongsToMany(Contest, {
      through: ContestParticipant,
      foreignKey: 'user_id',
      otherKey: 'contest_id',
      as: 'registeredContests'
    });
    
    // ==========================================
    // CONTEST SUBMISSION ASSOCIATIONS
    // ==========================================
    
    // Contest has many Submissions
    Contest.hasMany(ContestSubmission, {
      foreignKey: 'contest_id',
      as: 'submissions',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    // User has many Contest Submissions
    User.hasMany(ContestSubmission, {
      foreignKey: 'user_id',
      as: 'contestSubmissions',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    // ContestSubmission belongs to Contest
    ContestSubmission.belongsTo(Contest, {
      foreignKey: 'contest_id',
      as: 'contest',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    // ContestSubmission belongs to User
    ContestSubmission.belongsTo(User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    console.log('✅ All PostgreSQL model associations defined successfully');
    console.log('   - Contest <-> User (creator)');
    console.log('   - Contest <-> Participants');
    console.log('   - Contest <-> Submissions');
    console.log('   - User <-> Contest registrations');
    
    return true;
  } catch (error) {
    console.error('❌ Error defining associations:', error);
    console.error('Stack:', error.stack);
    return false;
  }
};

export default defineAssociations;