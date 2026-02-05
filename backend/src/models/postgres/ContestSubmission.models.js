import { DataTypes } from 'sequelize';
import { sequelize } from '../../db/postgres/index.js';

const ContestSubmission = sequelize.define('ContestSubmission', {
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
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  
  // ✅ FIX: Changed from INTEGER to STRING to store MongoDB ObjectId
  user_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'MongoDB User ObjectId'
  },
  
  // ✅ FIX: Changed from INTEGER to STRING to store MongoDB Problem ObjectId
  problem_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'MongoDB Problem ObjectId'
  },
  
  submission_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
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
    comment: 'accepted, wrong_answer, time_limit_exceeded, etc.',
    validate: {
      isIn: [[
        'pending',
        'accepted',
        'wrong_answer',
        'time_limit_exceeded',
        'memory_limit_exceeded',
        'runtime_error',
        'compilation_error'
      ]]
    }
  },
  
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Points earned for this submission',
    validate: {
      min: 0
    }
  },
  
  time_taken: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Execution time in milliseconds',
    validate: {
      min: 0
    }
  },
  
  memory_used: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Memory used in KB',
    validate: {
      min: 0
    }
  },
  
  test_cases_passed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  
  total_test_cases: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  
  submitted_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  
  is_best_submission: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Whether this is the best submission for this problem by this user'
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
  tableName: 'contest_submissions',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  
  indexes: [
    {
      name: 'idx_contest_submissions_contest',
      fields: ['contest_id']
    },
    {
      name: 'idx_contest_submissions_user',
      fields: ['user_id']
    },
    {
      name: 'idx_contest_submissions_problem',
      fields: ['problem_id']
    },
    {
      name: 'idx_contest_submissions_contest_user',
      fields: ['contest_id', 'user_id']
    },
    {
      name: 'idx_contest_submissions_contest_problem',
      fields: ['contest_id', 'problem_id']
    },
    {
      name: 'idx_contest_submissions_submission_id',
      unique: true,
      fields: ['submission_id']
    },
    {
      name: 'idx_contest_submissions_best',
      fields: ['contest_id', 'user_id', 'problem_id', 'is_best_submission']
    }
  ]
});

// Instance methods
ContestSubmission.prototype.isAccepted = function() {
  return this.status === 'accepted';
};

ContestSubmission.prototype.getAccuracy = function() {
  if (this.total_test_cases === 0) return 0;
  return (this.test_cases_passed / this.total_test_cases) * 100;
};

export default ContestSubmission;