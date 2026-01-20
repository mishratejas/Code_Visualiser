import { DataTypes } from 'sequelize';
import { sequelize } from '../../db/postgres/index.js';

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
    type: DataTypes.STRING,  //temporarily change
    defaultValue: 'practice',
    field: 'contest_type'
  },
  
  status: {
    type: DataTypes.STRING,
    defaultValue: 'draft'
  },
  
  start_time: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'start_time'
  },
  
  end_time: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'end_time'
  },
  
  duration_minutes: {
    type: DataTypes.INTEGER,
    comment: 'Duration in minutes',
    field: 'duration_minutes'
  },
  
  max_participants: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'max_participants'
  },
  
  registration_open: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'registration_open'
  },
  
  is_private: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_private'
  },
  
  registration_password: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'registration_password'
  },
  
  banner_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'banner_url'
  },
  
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'created_by'
  }
}, {
  tableName: 'contests',
  timestamps: true,
  underscored: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

export default Contest;