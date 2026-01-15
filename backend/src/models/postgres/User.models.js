import { DataTypes } from 'sequelize';
import { sequelize } from '../../db/postgres/index.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  mongo_id: {
    type: DataTypes.STRING(24),
    unique: true,
    allowNull: false,
    comment: 'Reference to MongoDB User _id'
  },
  
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  
  email: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: false
  },
  
  role: {
    type: DataTypes.ENUM('user', 'admin', 'moderator'),
    defaultValue: 'user'
  },
  
  name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
  avatar_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  country_code: {
    type: DataTypes.STRING(2),
    allowNull: true
  },
  
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  rank: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  total_problems_solved: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  easy_solved: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  medium_solved: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  hard_solved: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  max_streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  last_active_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    {
      name: 'idx_users_score',
      fields: ['score'],
      order: [['score', 'DESC']]
    },
    {
      name: 'idx_users_username',
      fields: ['username']
    },
    {
      name: 'idx_users_email',
      fields: ['email']
    }
  ]
});

export default User;