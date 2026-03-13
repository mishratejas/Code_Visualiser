import { DataTypes } from 'sequelize';
import { sequelize } from '../../db/postgres/index.js';

const Contest = sequelize.define('Contest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },

  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: { notEmpty: true, len: [3, 200] }
  },

  slug: {
    type: DataTypes.STRING(200),
    allowNull: false,
    unique: true,
    validate: { notEmpty: true, is: /^[a-z0-9-]+$/i }
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  contest_type: {
    type: DataTypes.STRING(255),
    defaultValue: 'rated',
    allowNull: false,
    // Added 'team' type — it's a real contest mode
    validate: {
      isIn: [['practice', 'weekly', 'monthly', 'rated', 'unrated', 'educational', 'challenge', 'team']]
    }
  },

  difficulty: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      isIn: [['easy', 'medium', 'hard', 'mixed']]
    }
  },

  status: {
    type: DataTypes.STRING(255),
    defaultValue: 'draft',
    allowNull: false,
    validate: {
      isIn: [['draft', 'upcoming', 'live', 'ended', 'cancelled']]
    }
  },

  start_time: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: { isDate: true }
  },

  end_time: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true,
      isAfterStartTime(value) {
        if (this.start_time && new Date(value) <= new Date(this.start_time)) {
          throw new Error('End time must be after start time');
        }
      }
    }
  },

  duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  max_participants: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1 }
  },

  registration_open: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },

  registration_deadline: {
    type: DataTypes.DATE,
    allowNull: true
  },

  is_private: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },

  registration_password: {
    type: DataTypes.STRING(100),
    allowNull: true
  },

  is_rated: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },

  scoring_type: {
    type: DataTypes.STRING(20),
    defaultValue: 'icpc',
    allowNull: false,
    validate: {
      isIn: [['icpc', 'ioi', 'atcoder', 'custom']]
    }
  },

  penalty_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 20,
    allowNull: false
  },

  allow_teams: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },

  max_team_size: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false
  },

  // Team contest: organization/group restriction
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'If set, only members of this group can participate'
  },

  banner_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING(255)),
    defaultValue: [],
    allowNull: true
  },

  rules: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  prizes: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: [],
    allowNull: true
  },

  editorial: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  problem_ids: {
    type: DataTypes.ARRAY(DataTypes.STRING(255)),
    defaultValue: [],
    allowNull: true,
    comment: 'Array of MongoDB Problem ObjectIds'
  },

  points_per_problem: {
    type: DataTypes.JSONB,
    defaultValue: {},
    allowNull: true
  },

  created_by: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'MongoDB User ObjectId'
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
  tableName: 'contests',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  freezeTableName: true,

  hooks: {
    beforeCreate: (contest) => {
      if (!contest.duration_minutes && contest.start_time && contest.end_time) {
        contest.duration_minutes = Math.round(
          (new Date(contest.end_time) - new Date(contest.start_time)) / 60000
        );
      }
    },
    beforeUpdate: (contest) => {
      if (contest.changed('start_time') || contest.changed('end_time')) {
        contest.duration_minutes = Math.round(
          (new Date(contest.end_time) - new Date(contest.start_time)) / 60000
        );
      }
    }
  }
});

// Instance methods
Contest.prototype.isUpcoming = function () { return new Date() < new Date(this.start_time); };
Contest.prototype.isLive = function () {
  const now = new Date();
  return now >= new Date(this.start_time) && now <= new Date(this.end_time);
};
Contest.prototype.hasEnded = function () { return new Date() > new Date(this.end_time); };
Contest.prototype.getStatus = function () {
  if (this.status === 'cancelled') return 'cancelled';
  if (this.isLive()) return 'live';
  if (this.isUpcoming()) return 'upcoming';
  if (this.hasEnded()) return 'ended';
  return this.status;
};
Contest.prototype.canRegister = function () {
  return this.registration_open && (this.isUpcoming() || this.isLive());
};
Contest.prototype.getProblemCount = function () {
  return this.problem_ids ? this.problem_ids.length : 0;
};

export default Contest;