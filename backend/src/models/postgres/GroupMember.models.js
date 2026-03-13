import { DataTypes } from 'sequelize';
import { sequelize } from '../../db/postgres/index.js';

const GroupMember = sequelize.define('GroupMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  group_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'groups', key: 'id' }
  },

  user_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'MongoDB User ObjectId'
  },

  // 'owner' | 'admin' | 'moderator' | 'member'
  role: {
    type: DataTypes.STRING(20),
    defaultValue: 'member',
    allowNull: false,
    validate: { isIn: [['owner', 'admin', 'moderator', 'member']] }
  },

  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    allowNull: false,
    validate: { isIn: [['active', 'pending', 'banned']] }
  },

  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },

  invited_by: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'MongoDB User ObjectId of the inviter'
  },
}, {
  tableName: 'group_members',
  timestamps: false,
  freezeTableName: true,
  indexes: [
    { unique: true, fields: ['group_id', 'user_id'] },
    { fields: ['user_id'] },
  ]
});

export default GroupMember;