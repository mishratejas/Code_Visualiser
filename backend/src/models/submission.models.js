import mongoose from 'mongoose';
import { LANGUAGES, VERDICT } from '../constants.js';

const executionResultSchema = new mongoose.Schema({
  testCaseIndex: {
    type: Number,
    required: true
  },
  passed: {
    type: Boolean,
    required: true
  },
  input: {
    type: String,
    required: true
  },
  expectedOutput: {
    type: String,
    required: true
  },
  actualOutput: String,
  runtime: Number,
  memory: Number,
  error: String,
  statusCode: Number,
  stderr: String,
  stdout: String
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
    index: true
  },
  
  language: {
    type: String,
    enum: Object.values(LANGUAGES),
    required: true,
    index: true
  },
  
  code: {
    type: String,
    required: true,
    maxlength: 10000
  },
  
  verdict: {
    type: String,
    enum: Object.values(VERDICT),
    default: VERDICT.PENDING,
    index: true
  },
  
  runtime: {
    type: Number,
    default: 0
  },
  
  memory: {
    type: Number,
    default: 0
  },
  
  testCasesPassed: {
    type: Number,
    default: 0
  },
  
  totalTestCases: {
    type: Number,
    required: true
  },
  
  executionResults: [executionResultSchema],
  
  errorMessage: String,
  
  compileTime: Number,
  
  executionTime: Number,
  
  codeSize: Number,
  
  aiAnalysis: {
    complexity: {
      time: String,
      space: String
    },
    codeQuality: Number,
    suggestions: [String],
    vulnerabilities: [String],
    similarityScore: Number
  },
  
  isContestSubmission: {
    type: Boolean,
    default: false
  },
  
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest'
  },
  
  ipAddress: String,
  
  userAgent: String,
  
  executedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
submissionSchema.virtual('isAccepted').get(function() {
  return this.verdict === VERDICT.ACCEPTED;
});

submissionSchema.virtual('isFailed').get(function() {
  return this.verdict !== VERDICT.ACCEPTED && this.verdict !== VERDICT.PENDING;
});

submissionSchema.virtual('status').get(function() {
  switch(this.verdict) {
    case VERDICT.PENDING: return 'Pending';
    case VERDICT.ACCEPTED: return 'Accepted';
    case VERDICT.WRONG_ANSWER: return 'Wrong Answer';
    case VERDICT.TIME_LIMIT_EXCEEDED: return 'Time Limit Exceeded';
    case VERDICT.RUNTIME_ERROR: return 'Runtime Error';
    case VERDICT.COMPILATION_ERROR: return 'Compilation Error';
    case VERDICT.MEMORY_LIMIT_EXCEEDED: return 'Memory Limit Exceeded';
    default: return 'Unknown';
  }
});

submissionSchema.virtual('color').get(function() {
  switch(this.verdict) {
    case VERDICT.ACCEPTED: return 'green';
    case VERDICT.WRONG_ANSWER: return 'red';
    case VERDICT.TIME_LIMIT_EXCEEDED: return 'orange';
    case VERDICT.RUNTIME_ERROR: return 'purple';
    case VERDICT.COMPILATION_ERROR: return 'gray';
    case VERDICT.MEMORY_LIMIT_EXCEEDED: return 'brown';
    default: return 'blue';
  }
});

// Indexes
submissionSchema.index({ user: 1, problem: 1, createdAt: -1 });
submissionSchema.index({ problem: 1, verdict: 1 });
submissionSchema.index({ createdAt: -1 });
submissionSchema.index({ 'aiAnalysis.codeQuality': -1 });
submissionSchema.index({ user: 1, contestId: 1 });

// Pre-save middleware
submissionSchema.pre('save', function(next) {
  if (this.code) {
    this.codeSize = Buffer.byteLength(this.code, 'utf8');
  }
  next();
});

// Methods
submissionSchema.methods.updateVerdict = function(newVerdict, runtime = 0, memory = 0) {
  this.verdict = newVerdict;
  this.runtime = runtime;
  this.memory = memory;
  return this.save();
};

submissionSchema.methods.addExecutionResult = function(result) {
  this.executionResults.push(result);
  return this.save();
};

// Static methods
submissionSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    { $group: {
      _id: null,
      totalSubmissions: { $sum: 1 },
      acceptedSubmissions: { 
        $sum: { $cond: [{ $eq: ['$verdict', VERDICT.ACCEPTED] }, 1, 0] }
      },
      totalRuntime: { $sum: '$runtime' },
      languages: { $addToSet: '$language' },
      problemsAttempted: { $addToSet: '$problem' }
    }}
  ]);
  
  return stats[0] || {
    totalSubmissions: 0,
    acceptedSubmissions: 0,
    totalRuntime: 0,
    languages: [],
    problemsAttempted: []
  };
};

submissionSchema.statics.getProblemStats = async function(problemId) {
  const stats = await this.aggregate([
    { $match: { problem: mongoose.Types.ObjectId(problemId) } },
    { $group: {
      _id: '$verdict',
      count: { $sum: 1 },
      avgRuntime: { $avg: '$runtime' },
      avgMemory: { $avg: '$memory' }
    }}
  ]);
  
  const total = stats.reduce((sum, stat) => sum + stat.count, 0);
  const accepted = stats.find(s => s._id === VERDICT.ACCEPTED)?.count || 0;
  
  return {
    totalSubmissions: total,
    acceptedSubmissions: accepted,
    acceptanceRate: total > 0 ? (accepted / total * 100).toFixed(2) : 0,
    verdictDistribution: stats,
    avgRuntime: stats.find(s => s._id === VERDICT.ACCEPTED)?.avgRuntime || 0
  };
};

submissionSchema.statics.getRecentSubmissions = async function(limit = 50) {
  return this.aggregate([
    { $match: { verdict: { $ne: VERDICT.PENDING } } },
    { $sort: { createdAt: -1 } },
    { $limit: limit },
    { $lookup: {
      from: 'users',
      localField: 'user',
      foreignField: '_id',
      as: 'user'
    }},
    { $unwind: '$user' },
    { $lookup: {
      from: 'problems',
      localField: 'problem',
      foreignField: '_id',
      as: 'problem'
    }},
    { $unwind: '$problem' },
    { $project: {
      _id: 1,
      verdict: 1,
      runtime: 1,
      language: 1,
      createdAt: 1,
      'user.username': 1,
      'user.profile.name': 1,
      'problem.title': 1,
      'problem.slug': 1,
      'problem.difficulty': 1
    }}
  ]);
};

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;