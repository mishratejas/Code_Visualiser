import { sequelize } from '../../db/postgres/index.js';

// Define associations - Use lazy imports
export const defineAssociations = async () => {
  try {
    // Lazy import models to avoid circular dependencies
    const Contest = (await import('./Contest.models.js')).default;
    const User = (await import('./User.models.js')).default;
    const ContestParticipant = (await import('./ContestParticipant.models.js')).default;
    
    // 1. Contest belongs to a User as creator
    Contest.belongsTo(User, {
      foreignKey: 'created_by',
      as: 'creator'
    });

    // 2. User has many created contests
    User.hasMany(Contest, {
      foreignKey: 'created_by',
      as: 'createdContests'
    });

    // 3. Contest has many Participants through ContestParticipant
    Contest.hasMany(ContestParticipant, {
      foreignKey: 'contest_id',
      as: 'participants'
    });
    
    // 4. User has many ContestParticipant entries
    User.hasMany(ContestParticipant, {
      foreignKey: 'user_id',
      as: 'contestRegistrations'
    });
    
    // 5. ContestParticipant belongs to Contest and User
    ContestParticipant.belongsTo(Contest, {
      foreignKey: 'contest_id',
      as: 'contest'
    });
    
    ContestParticipant.belongsTo(User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    
    // 6. Contest belongs to many Users through ContestParticipant
    Contest.belongsToMany(User, {
      through: ContestParticipant,
      foreignKey: 'contest_id',
      otherKey: 'user_id',
      as: 'users'
    });
    
    // 7. User belongs to many Contests through ContestParticipant
    User.belongsToMany(Contest, {
      through: ContestParticipant,
      foreignKey: 'user_id',
      otherKey: 'contest_id',
      as: 'contests'
    });
    
    console.log('✅ PostgreSQL associations defined successfully');
    return true;
  } catch (error) {
    console.error('❌ Error defining associations:', error);
    return false;
  }
};

export default defineAssociations;