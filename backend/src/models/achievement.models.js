import mongoose from 'mongoose';

// Achievement Schema
const achievementSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['milestone', 'streak', 'speed', 'mastery', 'contest', 'special'],
    required: true
  },
  points: {
    type: Number,
    required: true,
    min: 0
  },
  requirement: {
    type: Number,
    required: true,
    min: 1
  },
  type: {
    type: String,
    enum: ['count', 'streak', 'milestone', 'unique'],
    required: true
  },
  color: {
    type: String,
    default: 'from-blue-500 to-cyan-500'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// User Achievement Schema
const userAchievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  achievement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0
  },
  unlocked: {
    type: Boolean,
    default: false,
    index: true
  },
  unlockedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
userAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });
userAchievementSchema.index({ user: 1, unlocked: 1 });

// Virtual for completion percentage
userAchievementSchema.virtual('percentage').get(function() {
  if (!this.achievement || !this.achievement.requirement) return 0;
  return Math.min(100, Math.floor((this.progress / this.achievement.requirement) * 100));
});

// Method to unlock achievement
userAchievementSchema.methods.unlock = async function() {
  if (this.unlocked) return this;
  
  this.unlocked = true;
  this.unlockedAt = new Date();
  this.progress = this.achievement.requirement;
  
  await this.save();
  
  // Send notification
  const notificationService = (await import('../services/notification.service.js')).default;
  await notificationService.notifyAchievement(this.user, {
    title: this.achievement.title,
    description: this.achievement.description,
    points: this.achievement.points,
    icon: this.achievement.icon
  });
  
  return this;
};

// Static method to update progress
userAchievementSchema.statics.updateProgress = async function(userId, achievementKey, progress) {
  const Achievement = mongoose.model('Achievement');
  const achievement = await Achievement.findOne({ key: achievementKey });
  
  if (!achievement) {
    throw new Error(`Achievement ${achievementKey} not found`);
  }
  
  let userAchievement = await this.findOne({ user: userId, achievement: achievement._id })
    .populate('achievement');
  
  if (!userAchievement) {
    userAchievement = await this.create({
      user: userId,
      achievement: achievement._id,
      progress: 0
    });
    userAchievement.achievement = achievement;
  }
  
  if (userAchievement.unlocked) return userAchievement;
  
  userAchievement.progress = Math.max(userAchievement.progress, progress);
  
  // Check if achievement should be unlocked
  if (userAchievement.progress >= achievement.requirement) {
    await userAchievement.unlock();
  } else {
    await userAchievement.save();
  }
  
  return userAchievement;
};

// Static method to increment progress
userAchievementSchema.statics.incrementProgress = async function(userId, achievementKey, increment = 1) {
  const Achievement = mongoose.model('Achievement');
  const achievement = await Achievement.findOne({ key: achievementKey });
  
  if (!achievement) {
    throw new Error(`Achievement ${achievementKey} not found`);
  }
  
  let userAchievement = await this.findOne({ user: userId, achievement: achievement._id })
    .populate('achievement');
  
  if (!userAchievement) {
    userAchievement = await this.create({
      user: userId,
      achievement: achievement._id,
      progress: 0
    });
    userAchievement.achievement = achievement;
  }
  
  if (userAchievement.unlocked) return userAchievement;
  
  userAchievement.progress += increment;
  
  // Check if achievement should be unlocked
  if (userAchievement.progress >= achievement.requirement) {
    await userAchievement.unlock();
  } else {
    await userAchievement.save();
  }
  
  return userAchievement;
};

const Achievement = mongoose.model('Achievement', achievementSchema);
const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);

export { Achievement, UserAchievement };
export default Achievement;