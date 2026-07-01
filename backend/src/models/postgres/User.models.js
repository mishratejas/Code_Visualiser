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
    allowNull: false,
    // Don't define unique here - it's already in database
  },
  
  // ── mongo_id: links this stats-cache row back to the MongoDB user document. ──
  // This table is NOT a second source of user identity/auth — it's a read
  // replica for contest joins and rank queries. password_hash/email/role were
  // previously defined here with no controller ever reading them (auth lives
  // entirely in MongoDB via src/models/user.models.js + Passport/JWT). Storing
  // password hashes in a table nothing reads is a pure liability, so they were
  // removed. mongo_id was missing entirely despite syncService.js referencing
  // it — added here so that (currently dead) sync path has a real column to
  // upsert against instead of silently being dropped by Sequelize.
  mongo_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    field: 'mongo_id'
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
  tableName: 'users',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  freezeTableName: true  // ✅ Don't pluralize table name
});

export default User;