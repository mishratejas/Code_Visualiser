import mongoose from 'mongoose';

const interviewSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  
  topics: [{
    type: String,
    trim: true
  }],
  
  question: {
    id: String,
    title: String,
    description: String,
    difficulty: String,
    topics: [String],
    testCases: [{
      input: String,
      expectedOutput: String
    }]
  },
  
  answers: [{
    code: {
      type: String,
      required: true
    },
    explanation: String,
    language: {
      type: String,
      required: true
    },
    evaluation: {
      correctness: Number,
      complexity: String,
      codeQuality: Number,
      explanationQuality: Number,
      overallScore: Number
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  status: {
    type: String,
    enum: ['active', 'completed', 'expired', 'abandoned'],
    default: 'active'
  },
  
  startedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  expiresAt: {
    type: Date,
    required: true
  },
  
  completedAt: Date,
  
  duration: {
    type: Number, // in minutes
    default: 30
  },
  
  finalScore: {
    type: Number,
    min: 0,
    max: 100
  },
  
  report: {
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
    overallFeedback: String
  }
}, {
  timestamps: true
});

// Indexes
interviewSessionSchema.index({ user: 1, createdAt: -1 });
interviewSessionSchema.index({ status: 1, expiresAt: 1 });

// Methods
interviewSessionSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

interviewSessionSchema.methods.calculateFinalScore = function() {
  if (this.answers.length === 0) return 0;
  
  const totalScore = this.answers.reduce((sum, answer) => {
    return sum + (answer.evaluation?.overallScore || 0);
  }, 0);
  
  return totalScore / this.answers.length;
};

const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);

export default InterviewSession;