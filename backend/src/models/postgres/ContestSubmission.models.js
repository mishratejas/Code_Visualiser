import { DataTypes } from 'sequelize';
import { sequelize } from '../../db/postgres/index.js';

const ContestSubmission = sequelize.define('ContestSubmission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  contest_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'contests',
      key: 'id'
    },
    field: 'contest_id'
  },
  
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'user_id'
  },
  
  problem_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'problem_id'
  },
  
  submission_id: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'submission_id',
    comment: 'Reference to MongoDB submission'
  },
  
  language: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'accepted, wrong_answer, time_limit_exceeded, etc.'
  },
  
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Points earned for this submission'
  },
  
  time_taken: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Execution time in milliseconds',
    field: 'time_taken'
  },
  
  memory_used: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Memory used in KB',
    field: 'memory_used'
  },
  
  test_cases_passed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'test_cases_passed'
  },
  
  total_test_cases: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_test_cases'
  },
  
  submitted_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'submitted_at'
  },
  
  is_best_submission: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this is the best submission for this problem by this user',
    field: 'is_best_submission'
  }
}, {
  tableName: 'contest_submissions',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_contest_user',
      fields: ['contest_id', 'user_id']
    },
    {
      name: 'idx_contest_problem',
      fields: ['contest_id', 'problem_id']
    },
    {
      name: 'idx_contest_user_problem',
      fields: ['contest_id', 'user_id', 'problem_id']
    },
    {
      name: 'idx_submission_id',
      fields: ['submission_id'],
      unique: true
    },
    {
      name: 'idx_best_submission',
      fields: ['contest_id', 'user_id', 'problem_id', 'is_best_submission']
    }
  ]
});

export default ContestSubmission;