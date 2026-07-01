import { DataTypes } from 'sequelize';
import { sequelize } from '../../db/postgres/index.js';

/**
 * ContestRatingHistory — append-only audit trail for rating changes.
 *
 * L6 fix: ContestParticipant.rating_before/rating_after/rating_change are
 * single mutable columns on the participant row — every rating recompute
 * overwrites them with no record of what the value was before, when it
 * changed, or why. That's fine for "what is the user's rating right now"
 * but breaks down for anything else a real rating system needs:
 *   - a rating-over-time graph on a user's profile
 *   - a rollback path if a rating computation had a bug and needs correcting
 *   - an audit record of exactly which contest caused which rating delta
 *
 * This table is intentionally append-only (rows are never updated, only
 * inserted) — one row per (user, contest) rating computation.
 */
const ContestRatingHistory = sequelize.define('ContestRatingHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },

  contest_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'contests',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },

  // MongoDB User ObjectId — same convention as ContestParticipant.user_id
  // and ContestSubmission.user_id elsewhere in this schema.
  user_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'MongoDB User ObjectId',
  },

  rating_before: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  rating_after: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  rank: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Final rank in the contest that produced this rating change',
  },

  delta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'rating_after - rating_before, stored explicitly so it never has to be recomputed or drift',
  },

  computed_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },

  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
}, {
  tableName: 'contest_rating_history',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false, // append-only — rows are never updated after insert
  freezeTableName: true,

  indexes: [
    {
      // Primary access pattern: "give me this user's rating history over time"
      fields: ['user_id', 'computed_at'],
      name: 'idx_rating_history_user_timeline',
    },
    {
      // Secondary: "give me every rating change caused by this contest"
      fields: ['contest_id'],
      name: 'idx_rating_history_contest',
    },
  ],
});

export default ContestRatingHistory;