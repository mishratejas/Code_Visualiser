import mongoose from 'mongoose';

const similarityPairSchema = new mongoose.Schema({
  submission1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission',
    required: true
  },
  
  submission2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission',
    required: true
  },
  
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  similarityScore: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  
  tokenSimilarity: {
    type: Number,
    min: 0,
    max: 1
  },
  
  astSimilarity: {
    type: Number,
    min: 0,
    max: 1
  },
  
  structuralSimilarity: {
    type: Number,
    min: 0,
    max: 1
  },
  
  isSuspicious: {
    type: Boolean,
    default: false
  },
  
  reviewed: {
    type: Boolean,
    default: false
  },
  
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  reviewNotes: String,
  
  verdict: {
    type: String,
    enum: ['pending', 'plagiarism_confirmed', 'false_positive', 'common_solution'],
    default: 'pending'
  }
}, {
  _id: false
});

const plagiarismReportSchema = new mongoose.Schema({
  contest: {
    type: Number, // PostgreSQL contest ID
    required: true,
    index: true
  },
  
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem'
  },
  
  totalSubmissions: {
    type: Number,
    required: true
  },
  
  suspiciousPairs: [similarityPairSchema],
  
  averageSimilarity: {
    type: Number,
    required: true
  },
  
  threshold: {
    type: Number,
    default: 0.85
  },
  
  checkedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  checkedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  status: {
    type: String,
    enum: ['completed', 'in_progress', 'failed'],
    default: 'completed'
  },
  
  metadata: {
    processingTime: Number, // in seconds
    algorithmsUsed: [String],
    version: String
  }
}, {
  timestamps: true
});

// Indexes
plagiarismReportSchema.index({ contest: 1, checkedAt: -1 });
plagiarismReportSchema.index({ 'suspiciousPairs.isSuspicious': 1 });

// Methods
plagiarismReportSchema.methods.getConfirmedCases = function() {
  return this.suspiciousPairs.filter(pair => 
    pair.verdict === 'plagiarism_confirmed'
  ).length;
};

plagiarismReportSchema.methods.getPendingReview = function() {
  return this.suspiciousPairs.filter(pair => 
    !pair.reviewed && pair.isSuspicious
  );
};

const PlagiarismReport = mongoose.model('PlagiarismReport', plagiarismReportSchema);

export default PlagiarismReport;