import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import { USER_ROLES, LANGUAGES, DEFAULT_PREFERENCES } from '../constants.js';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    index: true
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email address'
    },
    index: true
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.USER,
    index: true
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  
  profile: {
    name: {
      type: String,
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    avatar: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: ''
    },
    country: String,
    university: String,
    graduationYear: Number,
    github: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || validator.isURL(v);
        },
        message: 'Please provide a valid GitHub URL'
      }
    },
    linkedin: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || validator.isURL(v);
        },
        message: 'Please provide a valid LinkedIn URL'
      }
    },
    website: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || validator.isURL(v);
        },
        message: 'Please provide a valid website URL'
      }
    },
    skills: [{
      name: String,
      level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert']
      }
    }]
  },
  
  stats: {
    totalSubmissions: {
      type: Number,
      default: 0
    },
    acceptedSubmissions: {
      type: Number,
      default: 0
    },
    totalProblemsSolved: {
      type: Number,
      default: 0
    },
    easySolved: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },
    streak: {
      type: Number,
      default: 0
    },
    maxStreak: {
      type: Number,
      default: 0
    },
    lastActiveDate: Date,
    rank: {
      type: Number,
      default: 0
    },
    score: {
      type: Number,
      default: 0
    }
  },
  
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: DEFAULT_PREFERENCES.theme
    },
    editorTheme: {
      type: String,
      default: 'vs-dark'
    },
    editorFontSize: {
      type: Number,
      min: 10,
      max: 30,
      default: DEFAULT_PREFERENCES.editorFontSize
    },
    defaultLanguage: {
      type: String,
      enum: Object.values(LANGUAGES),
      default: DEFAULT_PREFERENCES.defaultLanguage
    },
    enableSyntaxHighlighting: {
      type: Boolean,
      default: DEFAULT_PREFERENCES.enableSyntaxHighlighting
    },
    showLineNumbers: {
      type: Boolean,
      default: DEFAULT_PREFERENCES.showLineNumbers
    },
    tabSize: {
      type: Number,
      min: 2,
      max: 8,
      default: DEFAULT_PREFERENCES.tabSize
    },
    autoSave: {
      type: Boolean,
      default: true
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      submissionUpdates: { type: Boolean, default: true },
      contestReminders: { type: Boolean, default: true }
    }
  },
  
  security: {
    lastPasswordChange: Date,
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date,
    lastLogin: Date,
    loginHistory: [{
      timestamp: Date,
      ip: String,
      userAgent: String,
      location: String,
      success: Boolean
    }],
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: String
  },
  
  subscriptions: {
    isPremium: {
      type: Boolean,
      default: false
    },
    plan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'enterprise'],
      default: 'free'
    },
    subscriptionId: String,
    startDate: Date,
    endDate: Date,
    autoRenew: {
      type: Boolean,
      default: false
    }
  },
  
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem'
  }],
  
  solvedProblems: [{
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem'
    },
    solvedAt: Date,
    firstSolve: Boolean,
    bestRuntime: Number,
    bestMemory: Number,
    submissionsCount: Number
  }],
  
  attemptedProblems: [{
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem'
    },
    lastAttempt: Date,
    attemptsCount: Number,
    solved: Boolean
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
userSchema.virtual('stats.acceptanceRate').get(function() {
  if (this.stats.totalSubmissions === 0) return 0;
  return ((this.stats.acceptedSubmissions / this.stats.totalSubmissions) * 100).toFixed(2);
});

userSchema.virtual('stats.ranking').get(function() {
  // This would be calculated from leaderboard
  return `#${this.stats.rank}`;
});

userSchema.virtual('profile.avatarUrl').get(function() {
  if (this.profile.avatar) {
    return this.profile.avatar.startsWith('http') 
      ? this.profile.avatar 
      : `/uploads/avatars/${this.profile.avatar}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.username)}&background=random`;
});

// Indexes
userSchema.index({ 'stats.score': -1 });
userSchema.index({ 'stats.totalProblemsSolved': -1 });
userSchema.index({ 'stats.streak': -1 });
userSchema.index({ createdAt: -1 });

userSchema.pre('save', async function() {
  // Only hash if password was modified
  if (!this.isModified('password')) {
    return;
  }
  
  // Check if password exists
  if (!this.password || typeof this.password !== 'string') {
    throw new Error('Password is required and must be a string');
  }
  
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  
  // Use synchronous bcrypt for now
  try {
    const salt = bcrypt.genSaltSync(saltRounds);
    this.password = bcrypt.hashSync(this.password, salt);
    
    // Initialize security object if it doesn't exist
    if (!this.security) {
      this.security = {};
    }
    this.security.lastPasswordChange = new Date();
  } catch (error) {
    throw error;
  }
});

// Methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isLocked = function() {
  return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
};

userSchema.methods.incrementLoginAttempts = async function() {
  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
  const lockoutMinutes = parseInt(process.env.LOCKOUT_TIME) || 15;
  
  if (this.security.lockUntil && this.security.lockUntil < Date.now()) {
    this.security.failedLoginAttempts = 1;
    this.security.lockUntil = null;
    return this.save();
  }
  
  this.security.failedLoginAttempts += 1;
  
  if (this.security.failedLoginAttempts >= maxAttempts) {
    this.security.lockUntil = Date.now() + lockoutMinutes * 60 * 1000;
  }
  
  return this.save();
};

userSchema.methods.resetLoginAttempts = function() {
  this.security.failedLoginAttempts = 0;
  this.security.lockUntil = null;
  this.security.lastLogin = new Date();
  return this.save();
};

userSchema.methods.addLoginHistory = function(ip, userAgent, location, success) {
  this.security.loginHistory.push({
    timestamp: new Date(),
    ip,
    userAgent,
    location,
    success
  });
  
  // Keep only last 50 logins
  if (this.security.loginHistory.length > 50) {
    this.security.loginHistory = this.security.loginHistory.slice(-50);
  }
  
  return this.save();
};

userSchema.methods.updateStreak = function() {
  const today = new Date().toDateString();
  const lastActive = this.stats.lastActiveDate 
    ? new Date(this.stats.lastActiveDate).toDateString()
    : null;
  
  if (!lastActive || lastActive !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (lastActive === yesterdayStr) {
      this.stats.streak += 1;
    } else {
      this.stats.streak = 1;
    }
    
    if (this.stats.streak > this.stats.maxStreak) {
      this.stats.maxStreak = this.stats.streak;
    }
    
    this.stats.lastActiveDate = new Date();
    return this.save();
  }
};

userSchema.methods.addSolvedProblem = async function(problemId, runtime, memory) {
  const Problem = mongoose.model('Problem');
  const problem = await Problem.findById(problemId);
  
  if (!problem) return;
  
  const solvedIndex = this.solvedProblems.findIndex(
    sp => sp.problem.toString() === problemId.toString()
  );
  
  if (solvedIndex === -1) {
    // First time solving
    this.solvedProblems.push({
      problem: problemId,
      solvedAt: new Date(),
      firstSolve: true,
      bestRuntime: runtime,
      bestMemory: memory,
      submissionsCount: 1
    });
    
    this.stats.totalProblemsSolved += 1;
    
    // Update difficulty counts
    switch (problem.difficulty) {
      case 'easy':
        this.stats.easySolved += 1;
        this.stats.score += 10;
        break;
      case 'medium':
        this.stats.mediumSolved += 1;
        this.stats.score += 30;
        break;
      case 'hard':
        this.stats.hardSolved += 1;
        this.stats.score += 50;
        break;
    }
  } else {
    // Already solved, update best stats
    const solvedProblem = this.solvedProblems[solvedIndex];
    solvedProblem.submissionsCount += 1;
    
    if (runtime < solvedProblem.bestRuntime) {
      solvedProblem.bestRuntime = runtime;
    }
    
    if (memory < solvedProblem.bestMemory) {
      solvedProblem.bestMemory = memory;
    }
  }
  
  return this.save();
};

userSchema.methods.addAttemptedProblem = async function(problemId) {
  const attemptedIndex = this.attemptedProblems.findIndex(
    ap => ap.problem.toString() === problemId.toString()
  );
  
  if (attemptedIndex === -1) {
    this.attemptedProblems.push({
      problem: problemId,
      lastAttempt: new Date(),
      attemptsCount: 1,
      solved: false
    });
  } else {
    const attemptedProblem = this.attemptedProblems[attemptedIndex];
    attemptedProblem.lastAttempt = new Date();
    attemptedProblem.attemptsCount += 1;
  }
  
  return this.save();
};

userSchema.methods.markProblemAsSolved = function(problemId) {
  const attemptedIndex = this.attemptedProblems.findIndex(
    ap => ap.problem.toString() === problemId.toString()
  );
  
  if (attemptedIndex !== -1) {
    this.attemptedProblems[attemptedIndex].solved = true;
  }
  
  return this.save();
};

userSchema.methods.toggleBookmark = function(problemId) {
  const bookmarkIndex = this.bookmarks.indexOf(problemId);
  
  if (bookmarkIndex === -1) {
    this.bookmarks.push(problemId);
  } else {
    this.bookmarks.splice(bookmarkIndex, 1);
  }
  
  return this.save();
};

// Static methods
userSchema.statics.getLeaderboard = async function(limit = 100, skip = 0) {
  return this.aggregate([
    { $match: { isActive: true } },
    { $project: {
      username: 1,
      'profile.name': 1,
      'profile.avatar': 1,
      'stats.totalProblemsSolved': 1,
      'stats.easySolved': 1,
      'stats.mediumSolved': 1,
      'stats.hardSolved': 1,
      'stats.score': 1,
      'stats.streak': 1,
      'stats.acceptanceRate': 1,
      'stats.totalSubmissions': 1,
      'stats.acceptedSubmissions': 1
    }},
    { $sort: { 'stats.score': -1 } },
    { $skip: skip },
    { $limit: limit }
  ]);
};

userSchema.statics.getUserStats = async function(userId) {
  return this.aggregate([
    { $match: { _id: mongoose.Types.ObjectId(userId) } },
    { $project: {
      username: 1,
      email: 1,
      role: 1,
      'profile': 1,
      'stats': 1,
      'preferences': 1,
      solvedProblemsCount: { $size: '$solvedProblems' },
      attemptedProblemsCount: { $size: '$attemptedProblems' },
      bookmarksCount: { $size: '$bookmarks' }
    }}
  ]);
};

const User = mongoose.model('User', userSchema);
export default User;