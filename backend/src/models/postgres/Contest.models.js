import { DataTypes } from 'sequelize';
import { sequelize } from '../../db/postgres/index.js';
import User from './User.models.js';

const Contest = sequelize.define('Contest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  
  slug: {
    type: DataTypes.STRING(200),
    unique: true,
    allowNull: false
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  contest_type: {
    type: DataTypes.ENUM('practice', 'live', 'tournament'),
    defaultValue: 'practice'
  },
  
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'live', 'ended', 'cancelled'),
    defaultValue: 'draft'
  },
  
  start_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  
  end_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  
  duration_minutes: {
    type: DataTypes.INTEGER,
    comment: 'Duration in minutes'
  },
  
  max_participants: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  
  registration_open: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  is_private: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  registration_password: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
  banner_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  }
}, {
  tableName: 'contests',
  timestamps: true
});

// Relationships
Contest.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Contest, { foreignKey: 'created_by' });

export default Contest;