import mongoose from 'mongoose';

// ─── Comment (reply) sub-schema ───────────────────────────────────────────────
const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  authorName: String,
  authorAvatar: String,
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10000,
  },
  votes: { type: Number, default: 0 },
  voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isEdited: { type: Boolean, default: false },
  editedAt: Date,
  isPinned: { type: Boolean, default: false },
}, { timestamps: true });

// ─── Thread (post) schema ─────────────────────────────────────────────────────
const discussSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 300,
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50000,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  authorName: String,
  authorAvatar: String,

  category: {
    type: String,
    enum: ['discussion', 'editorial', 'help', 'announcement', 'general'],
    default: 'discussion',
  },
  tags: [{ type: String, trim: true, lowercase: true, maxlength: 30 }],

  // Link to problem (optional)
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    default: null,
  },
  problemTitle: String,

  // Link to contest (optional)
  contestId: { type: Number, default: null },

  votes: { type: Number, default: 0 },
  voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 },

  comments: [commentSchema],

  isPinned: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// Virtual for reply count
discussSchema.virtual('replyCount').get(function () {
  return this.comments?.length || 0;
});

// Indexes for common queries
discussSchema.index({ createdAt: -1 });
discussSchema.index({ votes: -1 });
discussSchema.index({ problemId: 1, createdAt: -1 });
discussSchema.index({ contestId: 1, createdAt: -1 });
discussSchema.index({ category: 1, createdAt: -1 });
discussSchema.index({ tags: 1 });
discussSchema.index({ author: 1 });

const Discuss = mongoose.model('Discuss', discussSchema);
export default Discuss;