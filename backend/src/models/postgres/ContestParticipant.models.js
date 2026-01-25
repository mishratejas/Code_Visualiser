import { DataTypes } from 'sequelize';
import { sequelize } from '../../db/postgres/index.js';

const ContestParticipant = sequelize.define('ContestParticipant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  
  contest_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  rank: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  problems_solved: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  total_time: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total time in seconds'
  },
  
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  
  last_submission_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'contest_participants',
  timestamps: true,
  indexes: [
    {
      name: 'idx_contest_participant',
      fields: ['contest_id', 'user_id'],
      unique: true
    },
    {
      name: 'idx_contest_rank',
      fields: ['contest_id', 'score'],
      order: [['score', 'DESC']]
    }
  ]
});

export default ContestParticipant;