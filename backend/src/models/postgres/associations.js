import User from './User.models.js';
import Contest from './Contest.models.js';
import ContestParticipant from './ContestParticipant.models.js';

export const setupAssociations = () => {
  try {
    // User-Contest relationships (contest creator)
    Contest.belongsTo(User, { 
      foreignKey: 'created_by', 
      as: 'creator',
      targetKey: 'id'
    });
    
    User.hasMany(Contest, { 
      foreignKey: 'created_by', 
      as: 'createdContests'
    });
    
    // Contest-ContestParticipant relationships
    Contest.hasMany(ContestParticipant, { 
      foreignKey: 'contest_id', 
      as: 'participants' 
    });
    
    ContestParticipant.belongsTo(Contest, { 
      foreignKey: 'contest_id' 
    });
    
    // User-ContestParticipant relationships
    User.hasMany(ContestParticipant, { 
      foreignKey: 'user_id', 
      as: 'contestParticipations' 
    });
    
    ContestParticipant.belongsTo(User, { 
      foreignKey: 'user_id' 
    });
    
    console.log('✅ Database associations set up successfully');
  } catch (error) {
    console.error('❌ Error setting up associations:', error);
  }
};