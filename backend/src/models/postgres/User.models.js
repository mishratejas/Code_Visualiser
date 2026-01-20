import { DataTypes } from 'sequelize';
import { sequelize } from '../../db/postgres/index.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  
  email: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash' // Explicitly map to snake_case column
  },
  
  role: {
    type: DataTypes.STRING(20),
    defaultValue: 'user'
  },
  
  name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
  avatar_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'avatar_url'
  },
  
  country_code: {
    type: DataTypes.STRING(2),
    allowNull: true,
    field: 'country_code'
  },
  
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  total_problems_solved: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_problems_solved'
  },
  
  easy_solved: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'easy_solved'
  },
  
  medium_solved: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'medium_solved'
  },
  
  hard_solved: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'hard_solved'
  },
  
  streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  rank: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  profile: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  
  stats: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  
  security: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  
  subscriptions: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  
  is_email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_email_verified'
  },
  
  is_profile_complete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_profile_complete'
  },
  
  bookmarks: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },
  
  solved_problems: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: [],
    field: 'solved_problems'
  },
  
  attempted_problems: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: [],
    field: 'attempted_problems'
  }
}, {
  tableName: 'users',
  timestamps: true, // This will use createdAt and updatedAt
  underscored: true, // This tells Sequelize to use snake_case for timestamps
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

export default User;