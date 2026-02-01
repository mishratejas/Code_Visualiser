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
    validate: {
      notEmpty: true,
      len: [3, 200]
    }
  },
  
  slug: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      isLowercase: true,
      is: /^[a-z0-9-]+$/i
    }
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  contest_type: {
    type: DataTypes.STRING(255),
    defaultValue: 'practice',
    allowNull: false,
    validate: {
      isIn: [['practice', 'weekly', 'monthly', 'rated', 'unrated', 'educational', 'challenge']]
    }
  },
  
  difficulty: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      isIn: [['easy', 'medium', 'hard']]
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
    validate: {
      isDate: true
    }
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
    allowNull: true,
    comment: 'Duration in minutes'
  },
  
  max_participants: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    }
  },
  
  registration_open: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
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
  
  banner_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      isUrl: true
    }
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
  
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
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
  
  // IMPORTANT: Don't let Sequelize sync/alter the table
  // We manage the schema manually
  freezeTableName: true,
  
  hooks: {
    // Before creating, calculate duration if not provided
    beforeCreate: (contest, options) => {
      if (!contest.duration_minutes && contest.start_time && contest.end_time) {
        const duration = Math.round(
          (new Date(contest.end_time) - new Date(contest.start_time)) / (1000 * 60)
        );
        contest.duration_minutes = duration;
      }
    },
    
    // Before updating, recalculate duration if times changed
    beforeUpdate: (contest, options) => {
      if (contest.changed('start_time') || contest.changed('end_time')) {
        const duration = Math.round(
          (new Date(contest.end_time) - new Date(contest.start_time)) / (1000 * 60)
        );
        contest.duration_minutes = duration;
      }
    }
  }
});

// Instance methods
Contest.prototype.isUpcoming = function() {
  return new Date() < new Date(this.start_time);
};

Contest.prototype.isLive = function() {
  const now = new Date();
  return now >= new Date(this.start_time) && now <= new Date(this.end_time);
};

Contest.prototype.hasEnded = function() {
  return new Date() > new Date(this.end_time);
};

Contest.prototype.getStatus = function() {
  if (this.isLive()) return 'live';
  if (this.isUpcoming()) return 'upcoming';
  if (this.hasEnded()) return 'ended';
  return this.status;
};

Contest.prototype.canRegister = function() {
  return this.registration_open && this.isUpcoming();
};

export default Contest;