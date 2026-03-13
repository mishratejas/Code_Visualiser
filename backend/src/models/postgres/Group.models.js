import { DataTypes } from 'sequelize';
import { sequelize } from '../../db/postgres/index.js';

const Group = sequelize.define('Group', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true, len: [2, 100] }
  },

  slug: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
    validate: { is: /^[a-z0-9-]+$/i }
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  avatar_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  banner_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // 'public' = anyone can join, 'private' = invite only, 'secret' = hidden
  visibility: {
    type: DataTypes.STRING(20),
    defaultValue: 'public',
    allowNull: false,
    validate: { isIn: [['public', 'private', 'secret']] }
  },

  // Organization or informal group
  type: {
    type: DataTypes.STRING(20),
    defaultValue: 'group',
    allowNull: false,
    validate: { isIn: [['group', 'organization', 'team', 'club']] }
  },

  join_password: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

  owner_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'MongoDB User ObjectId'
  },

  member_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },

  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING(50)),
    defaultValue: [],
  },

  website: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },

  country: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },

  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },

  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },

  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at',
  },
}, {
  tableName: 'groups',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  freezeTableName: true,
});

export default Group;