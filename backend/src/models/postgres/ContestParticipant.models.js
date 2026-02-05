import { DataTypes } from 'sequelize';
import { sequelize } from '../../db/postgres/index.js';

const ContestParticipant = sequelize.define('ContestParticipant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  
  contest_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'contests',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  
  // ✅ FIX: Changed from INTEGER to STRING to store MongoDB ObjectId
  user_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'MongoDB User ObjectId'
  },
  
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  
  problems_solved: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  
  total_time: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Total time spent in minutes',
    validate: {
      min: 0
    }
  },
  
  penalty_time: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Penalty time for wrong submissions in minutes'
  },
  
  joined_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  
  last_submission_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  rank: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Current rank in the contest'
  },
  
  is_disqualified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'contest_participants',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  freezeTableName: true,
  
  indexes: [
    {
      unique: true,
      fields: ['contest_id', 'user_id'],
      name: 'unique_contest_participant'
    },
    {
      fields: ['contest_id', 'score', 'total_time'],
      name: 'idx_contest_leaderboard'
    },
    {
      fields: ['user_id'],
      name: 'idx_participant_user'
    },
    {
      fields: ['contest_id', 'joined_at'],
      name: 'idx_contest_registration'
    }
  ],
  
  hooks: {
    beforeUpdate: (participant, options) => {
      // Automatically update last_submission_at when score changes
      if (participant.changed('score')) {
        participant.last_submission_at = new Date();
      }
    }
  }
});

// Instance methods
ContestParticipant.prototype.updateScore = async function(additionalScore, timeTaken) {
  this.score += additionalScore;
  this.total_time += timeTaken;
  this.problems_solved += 1;
  this.last_submission_at = new Date();
  await this.save();
  return this;
};

ContestParticipant.prototype.addPenalty = async function(penaltyMinutes) {
  this.penalty_time += penaltyMinutes;
  this.total_time += penaltyMinutes;
  await this.save();
  return this;
};

ContestParticipant.prototype.disqualify = async function() {
  this.is_disqualified = true;
  await this.save();
  return this;
};

// Static methods
ContestParticipant.getLeaderboard = async function(contestId, limit = 100) {
  return await this.findAll({
    where: { 
      contest_id: contestId,
      is_disqualified: false
    },
    order: [
      ['score', 'DESC'],
      ['total_time', 'ASC'],
      ['joined_at', 'ASC']
    ],
    limit
  });
};

ContestParticipant.getUserRank = async function(contestId, userId) {
  const participants = await this.findAll({
    where: { 
      contest_id: contestId,
      is_disqualified: false
    },
    order: [
      ['score', 'DESC'],
      ['total_time', 'ASC'],
      ['joined_at', 'ASC']
    ],
    attributes: ['user_id', 'score', 'total_time']
  });
  
  const userIndex = participants.findIndex(p => p.user_id === userId);
  return userIndex !== -1 ? userIndex + 1 : null;
};

ContestParticipant.isRegistered = async function(contestId, userId) {
  const participant = await this.findOne({
    where: { contest_id: contestId, user_id: userId }
  });
  return !!participant;
};

ContestParticipant.getParticipantCount = async function(contestId) {
  return await this.count({
    where: { contest_id: contestId }
  });
};

export default ContestParticipant;