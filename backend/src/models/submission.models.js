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
  error: String
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
    required: true
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
  
  executionTime: Number,
  
  codeSize: {
    type: Number,
    default: 0
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

submissionSchema.virtual('status').get(function() {
  switch(this.verdict) {
    case VERDICT.ACCEPTED: return 'Accepted';
    case VERDICT.WRONG_ANSWER: return 'Wrong Answer';
    case VERDICT.TIME_LIMIT_EXCEEDED: return 'Time Limit Exceeded';
    case VERDICT.RUNTIME_ERROR: return 'Runtime Error';
    case VERDICT.COMPILATION_ERROR: return 'Compilation Error';
    case VERDICT.MEMORY_LIMIT_EXCEEDED: return 'Memory Limit Exceeded';
    case VERDICT.PENDING: return 'Pending';
    default: return 'Unknown';
  }
});

// Indexes for better query performance
submissionSchema.index({ user: 1, problem: 1, createdAt: -1 });
submissionSchema.index({ problem: 1, verdict: 1 });
submissionSchema.index({ createdAt: -1 });
submissionSchema.index({ user: 1, contestId: 1 });
submissionSchema.index({ verdict: 1, createdAt: -1 });

// Pre-save middleware
submissionSchema.pre('save', function() {
  if (this.code) {
    this.codeSize = Buffer.byteLength(this.code, 'utf8');
  }
  if (!this.executedAt) {
    this.executedAt = new Date();
  }
});

// Static methods
submissionSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
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
    { $match: { problem: new mongoose.Types.ObjectId(problemId) } },
    { $group: {
      _id: '$verdict',
      count: { $sum: 1 },
      avgRuntime: { $avg: '$runtime' }
    }}
  ]);
  
  const total = stats.reduce((sum, stat) => sum + stat.count, 0);
  const accepted = stats.find(s => s._id === VERDICT.ACCEPTED)?.count || 0;
  
  return {
    totalSubmissions: total,
    acceptedSubmissions: accepted,
    acceptanceRate: total > 0 ? (accepted / total * 100).toFixed(2) : 0,
    verdictDistribution: stats
  };
};

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;