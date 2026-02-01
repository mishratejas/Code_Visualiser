import { DataTypes } from 'sequelize';
import { sequelize } from '../../db/postgres/index.js';

const ContestParticipant = sequelize.define('ContestParticipant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  
  contest_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'contests',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  
  rank: {
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
    comment: 'Total time in seconds',
    validate: {
      min: 0
    }
  },
  
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  
  last_submission_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'contest_participants',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  
  indexes: [
    {
      name: 'idx_contest_participant_unique',
      unique: true,
      fields: ['contest_id', 'user_id']
    },
    {
      name: 'idx_contest_participants_contest',
      fields: ['contest_id']
    },
    {
      name: 'idx_contest_participants_user',
      fields: ['user_id']
    },
    {
      name: 'idx_contest_participants_score',
      fields: ['contest_id', { name: 'score', order: 'DESC' }]
    },
    {
      name: 'idx_contest_participants_rank',
      fields: ['contest_id', 'rank']
    }
  ]
});

// Instance methods
ContestParticipant.prototype.updateScore = async function(newScore) {
  this.score = newScore;
  this.last_submission_at = new Date();
  await this.save();
};

ContestParticipant.prototype.incrementProblemsSolved = async function() {
  this.problems_solved += 1;
  this.last_submission_at = new Date();
  await this.save();
};

export default ContestParticipant;