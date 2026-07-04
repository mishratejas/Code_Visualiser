import { DataTypes } from 'sequelize';
import { sequelize } from '../../db/postgres/index.js';

/**
 * ContestRejudge — durable state machine for a rejudge operation.
 *
 * L7 fix: a rejudge (re-running the judge across every ContestSubmission
 * row for a contest — e.g. after fixing a bad test case) is a long-running
 * batch operation, potentially touching thousands of rows. Without a row
 * like this to track it:
 *   - there's nowhere for the UI to read "is a rejudge in progress, and how
 *     far along is it"
 *   - if the process crashes mid-rejudge, there's no record that it was
 *     ever started, so submissions can be left in an ambiguous state with
 *     no way to know whether they were rejudged or not
 *   - there's no audit trail of who triggered a rejudge, or why
 *
 * This model is the state machine row only — it does not implement the
 * rejudge worker itself (that's queue/worker logic, e.g. a Bull job similar
 * to judge.worker.js, that would update total/completed/failed as it goes).
 * Wiring an actual rejudge job to write into this table is future work;
 * this fix gives it somewhere durable to write to.
 */
const ContestRejudge = sequelize.define('ContestRejudge', {
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

  // MongoDB User ObjectId of the admin/organizer who triggered this rejudge.
  triggered_by: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'MongoDB User ObjectId',
  },

  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Why this rejudge was triggered, e.g. "fixed bad test case on problem X"',
  },

  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'running', 'completed', 'failed', 'cancelled']],
    },
  },

  total_submissions: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'How many ContestSubmission rows this rejudge covers',
  },

  completed_submissions: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Progress counter — lets the UI show a percentage',
  },

  failed_submissions: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },

  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Populated if status is "failed"',
  },

  started_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },

  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at',
  },
}, {
  tableName: 'contest_rejudges',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  freezeTableName: true,

  indexes: [
    {
      // "Is there a rejudge already running for this contest" / history list
      fields: ['contest_id', 'created_at'],
      name: 'idx_rejudge_contest_timeline',
    },
    {
      // "Show me anything still pending/running" — for a worker to pick up
      fields: ['status'],
      name: 'idx_rejudge_status',
    },
  ],
});

export default ContestRejudge;