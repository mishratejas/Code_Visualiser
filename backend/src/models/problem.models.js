import mongoose from 'mongoose';
import { DIFFICULTY, PROBLEM_TAGS } from '../constants.js';

const testCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: [true, 'Test case input is required'],
    trim: true
  },
  expectedOutput: {
    type: String,
    required: [true, 'Test case expected output is required'],
    trim: true
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  explanation: String,
  timeLimit: {
    type: Number,
    default: 2000
  },
  memoryLimit: {
    type: Number,
    default: 256
  }
}, { _id: false });

const hintSchema = new mongoose.Schema({
  title: String,
  content: {
    type: String,
    required: true
  },
  order: Number
}, { _id: false });

const editorialSchema = new mongoose.Schema({
  approach: String,
  complexity: {
    time: String,
    space: String
  },
  code: {
    python: String,
    cpp: String,
    java: String,
    javascript: String
  },
  explanation: String,
  writtenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  publishedAt: Date
}, { _id: false });

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Problem title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    index: true
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
  description: {
    type: String,
    required: [true, 'Problem description is required']
  },
  
  difficulty: {
    type: String,
    enum: Object.values(DIFFICULTY),
    required: [true, 'Difficulty level is required'],
    index: true
  },
  
  tags: [{
    type: String,
    enum: PROBLEM_TAGS,
    index: true
  }],
  
  constraints: {
    timeLimit: {
      type: Number,
      default: 2000,
      min: [100, 'Time limit must be at least 100ms'],
      max: [10000, 'Time limit cannot exceed 10 seconds']
    },
    memoryLimit: {
      type: Number,
      default: 256,
      min: [16, 'Memory limit must be at least 16MB'],
      max: [1024, 'Memory limit cannot exceed 1GB']
    },
    inputConstraints: String,
    outputConstraints: String
  },
  
  inputFormat: {
    type: String,
    required: [true, 'Input format is required']
  },
  
  outputFormat: {
    type: String,
    required: [true, 'Output format is required']
  },
  
  sampleInput: [String],
  sampleOutput: [String],
  sampleExplanation: [String],
  
  testCases: {
    type: [testCaseSchema],
    required: [true, 'At least one test case is required'],
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'At least one test case is required'
    }
  },
  
  hints: [hintSchema],
  
  editorial: editorialSchema,
  
  discussionCount: {
    type: Number,
    default: 0
  },
  
  metadata: {
    isPublished: {
      type: Boolean,
      default: false
    },
    publishedAt: Date,
    views: {
      type: Number,
      default: 0
    },
    submissions: {
      type: Number,
      default: 0
    },
    acceptanceRate: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    dislikes: {
      type: Number,
      default: 0
    },
    bookmarks: {
      type: Number,
      default: 0
    },
    avgRuntime: {
      type: Number,
      default: 0
    },
    avgMemory: {
      type: Number,
      default: 0
    }
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // For ML/analytics
  difficultyScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  popularityScore: {
    type: Number,
    default: 0
  },
  
  similarProblems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem'
  }],
  
  // For contests
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest'
  },
  
  points: {
    type: Number,
    default: 0
  },
  
  // For categorization
  category: {
    type: String,
    enum: ['algorithm', 'database', 'shell', 'concurrency', 'system-design', 'other'],
    default: 'algorithm'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
problemSchema.virtual('totalTestCases').get(function() {
  return this.testCases.length;
});

problemSchema.virtual('publicTestCases').get(function() {
  return this.testCases.filter(tc => !tc.isHidden);
});

problemSchema.virtual('hiddenTestCases').get(function() {
  return this.testCases.filter(tc => tc.isHidden);
});

problemSchema.virtual('hasEditorial').get(function() {
  return !!this.editorial && !!this.editorial.approach;
});

problemSchema.virtual('url').get(function() {
  return `/problems/${this.slug}`;
});

// Indexes
problemSchema.index({ difficulty: 1, 'metadata.acceptanceRate': -1 });
problemSchema.index({ 'metadata.isPublished': 1, createdAt: -1 });
problemSchema.index({ tags: 1, difficulty: 1 });
problemSchema.index({ 'metadata.views': -1 });
problemSchema.index({ 'metadata.submissions': -1 });
problemSchema.index({ difficultyScore: 1 });
problemSchema.index({ popularityScore: -1 });

// Pre-save middleware
problemSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  // Update difficulty score based on acceptance rate
  if (this.metadata.submissions > 0) {
    if (this.metadata.acceptanceRate > 70) {
      this.difficultyScore = 20; // Easy
    } else if (this.metadata.acceptanceRate > 40) {
      this.difficultyScore = 50; // Medium
    } else {
      this.difficultyScore = 80; // Hard
    }
  }
  
  // Calculate popularity score
  this.popularityScore = 
    (this.metadata.views * 0.1) + 
    (this.metadata.submissions * 0.3) + 
    (this.metadata.likes * 0.5);
  
  next();
});

// Methods
problemSchema.methods.updateAcceptanceRate = async function() {
  const Submission = mongoose.model('Submission');
  
  const stats = await Submission.aggregate([
    { $match: { problem: this._id } },
    { $group: {
      _id: null,
      total: { $sum: 1 },
      accepted: { 
        $sum: { 
          $cond: [{ $eq: ['$verdict', 'accepted'] }, 1, 0] 
        }
      }
    }}
  ]);
  
  if (stats.length > 0) {
    this.metadata.submissions = stats[0].total;
    this.metadata.acceptanceRate = stats[0].total > 0 
      ? (stats[0].accepted / stats[0].total) * 100 
      : 0;
    
    await this.save();
  }
};

problemSchema.methods.incrementViews = async function() {
  this.metadata.views += 1;
  await this.save();
};

problemSchema.methods.updateAvgRuntime = async function() {
  const Submission = mongoose.model('Submission');
  
  const stats = await Submission.aggregate([
    { $match: { 
      problem: this._id,
      verdict: 'accepted',
      runtime: { $exists: true, $gt: 0 }
    }},
    { $group: {
      _id: null,
      avgRuntime: { $avg: '$runtime' },
      avgMemory: { $avg: '$memory' }
    }}
  ]);
  
  if (stats.length > 0) {
    this.metadata.avgRuntime = Math.round(stats[0].avgRuntime);
    this.metadata.avgMemory = Math.round(stats[0].avgMemory);
    await this.save();
  }
};

problemSchema.methods.toggleLike = async function(userId, like = true) {
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  
  if (!user) return false;
  
  // Check if user already liked/disliked
  // This would need a separate Likes collection for production
  
  if (like) {
    this.metadata.likes += 1;
  } else {
    this.metadata.dislikes += 1;
  }
  
  await this.save();
  return true;
};

problemSchema.methods.addBookmarkCount = async function() {
  this.metadata.bookmarks += 1;
  await this.save();
};

problemSchema.methods.removeBookmarkCount = async function() {
  if (this.metadata.bookmarks > 0) {
    this.metadata.bookmarks -= 1;
    await this.save();
  }
};

// Static methods
problemSchema.statics.getProblemsByDifficulty = async function(difficulty, limit = 50, skip = 0) {
  return this.aggregate([
    { $match: { 
      difficulty: difficulty,
      'metadata.isPublished': true 
    }},
    { $project: {
      title: 1,
      slug: 1,
      difficulty: 1,
      tags: 1,
      'metadata.acceptanceRate': 1,
      'metadata.submissions': 1,
      'metadata.views': 1,
      'metadata.likes': 1,
      'metadata.dislikes': 1,
      hasEditorial: { $ifNull: ['$editorial.approach', false] }
    }},
    { $sort: { 'metadata.acceptanceRate': -1 } },
    { $skip: skip },
    { $limit: limit }
  ]);
};

problemSchema.statics.getTagStats = async function() {
  return this.aggregate([
    { $match: { 'metadata.isPublished': true } },
    { $unwind: '$tags' },
    { $group: {
      _id: '$tags',
      count: { $sum: 1 },
      avgAcceptance: { $avg: '$metadata.acceptanceRate' },
      avgDifficulty: { 
        $avg: { 
          $switch: {
            branches: [
              { case: { $eq: ['$difficulty', 'easy'] }, then: 1 },
              { case: { $eq: ['$difficulty', 'medium'] }, then: 2 },
              { case: { $eq: ['$difficulty', 'hard'] }, then: 3 }
            ],
            default: 2
          }
        }
      }
    }},
    { $sort: { count: -1 } }
  ]);
};

problemSchema.statics.getProblemStats = async function() {
  return this.aggregate([
    { $match: { 'metadata.isPublished': true } },
    { $group: {
      _id: null,
      totalProblems: { $sum: 1 },
      easyProblems: { $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, 0] } },
      mediumProblems: { $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] } },
      hardProblems: { $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] }, 1, 0] } },
      avgAcceptanceRate: { $avg: '$metadata.acceptanceRate' },
      totalSubmissions: { $sum: '$metadata.submissions' },
      totalViews: { $sum: '$metadata.views' }
    }}
  ]);
};

problemSchema.statics.searchProblems = async function(query, filters = {}, limit = 20, skip = 0) {
  const matchStage = { 'metadata.isPublished': true };
  
  // Text search
  if (query && query.trim().length >= 2) {
    matchStage.$text = { $search: query };
  }
  
  // Apply filters
  if (filters.difficulty) {
    matchStage.difficulty = filters.difficulty;
  }
  
  if (filters.tags && filters.tags.length > 0) {
    matchStage.tags = { $all: filters.tags };
  }
  
  if (filters.category) {
    matchStage.category = filters.category;
  }
  
  const pipeline = [
    { $match: matchStage },
    { $project: {
      title: 1,
      slug: 1,
      difficulty: 1,
      tags: 1,
      category: 1,
      'metadata.acceptanceRate': 1,
      'metadata.submissions': 1,
      'metadata.views': 1,
      'metadata.likes': 1,
      'metadata.dislikes': 1,
      score: { $meta: 'textScore' }
    }},
    { $sort: filters.sortBy === 'popularity' 
      ? { 'metadata.views': -1 } 
      : filters.sortBy === 'acceptance'
        ? { 'metadata.acceptanceRate': -1 }
        : { score: { $meta: 'textScore' } }
    },
    { $skip: skip },
    { $limit: limit }
  ];
  
  return this.aggregate(pipeline);
};

const Problem = mongoose.model('Problem', problemSchema);
export default Problem;