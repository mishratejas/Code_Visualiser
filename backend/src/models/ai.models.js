import mongoose from 'mongoose';

const aiAnalysisSchema = new mongoose.Schema({
  submission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission',
    required: true,
    index: true
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  
  qualityScore: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  
  qualityLabel: {
    type: String,
    enum: ['poor', 'fair', 'good', 'excellent'],
    required: true
  },
  
  timeComplexity: {
    type: String,
    required: true
  },
  
  spaceComplexity: {
    type: String
  },
  
  antiPatterns: [{
    type: {
      type: String,
      required: true
    },
    description: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    location: String,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  }],
  
  suggestions: [String],
  
  cyclomaticComplexity: Number,
  
  linesOfCode: Number,
  
  performanceRating: {
    type: String,
    enum: ['inefficient', 'acceptable', 'optimized']
  },
  
  bottleneckAnalysis: [String],
  
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  
  features: {
    type: mongoose.Schema.Types.Mixed
  },
  
  analyzedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
aiAnalysisSchema.index({ user: 1, analyzedAt: -1 });
aiAnalysisSchema.index({ problem: 1, qualityScore: -1 });
aiAnalysisSchema.index({ submission: 1 }, { unique: true });

const AIAnalysis = mongoose.model('AIAnalysis', aiAnalysisSchema);

export default AIAnalysis;