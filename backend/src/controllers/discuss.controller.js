import Discuss from '../models/discuss.models.js';
import User from '../models/user.models.js';

// ─── helpers ──────────────────────────────────────────────────────────────────
const getUserMeta = async (userId) => {
  try {
    const u = await User.findById(userId).select('username profile.avatar').lean();
    return { name: u?.username || 'User', avatar: u?.profile?.avatar || null };
  } catch { return { name: 'User', avatar: null }; }
};

const toThread = (doc) => ({
  id: doc._id,
  title: doc.title,
  body: doc.body,
  author: doc.authorName || 'User',
  authorAvatar: doc.authorAvatar,
  authorId: doc.author,
  category: doc.category,
  tags: doc.tags || [],
  votes: doc.votes || 0,
  views: doc.views || 0,
  replies: doc.comments?.length || 0,
  time: doc.createdAt,
  problemId: doc.problemId,
  problemTitle: doc.problemTitle,
  contestId: doc.contestId,
  isPinned: doc.isPinned,
  isLocked: doc.isLocked,
});

// ─── GET /discuss ─────────────────────────────────────────────────────────────
export const getThreads = async (req, res) => {
  try {
    const {
      page = 1, limit = 20, sort = 'hot',
      category, tag, problemId, contestId, search,
    } = req.query;

    const filter = { isDeleted: false };
    if (category && category !== 'all') filter.category = category.toLowerCase();
    if (tag) filter.tags = tag.toLowerCase();
    if (problemId) filter.problemId = problemId;
    if (contestId) filter.contestId = Number(contestId);
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { body:  { $regex: search, $options: 'i' } },
    ];

    let sortBy = {};
    if (sort === 'hot')   sortBy = { isPinned: -1, votes: -1, createdAt: -1 };
    if (sort === 'new')   sortBy = { isPinned: -1, createdAt: -1 };
    if (sort === 'top')   sortBy = { isPinned: -1, votes: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [threads, total] = await Promise.all([
      Discuss.find(filter)
        .sort(sortBy)
        .skip(skip)
        .limit(Number(limit))
        .select('-comments.voters -voters')
        .lean(),
      Discuss.countDocuments(filter),
    ]);

    const tags = await Discuss.aggregate([
      { $match: { isDeleted: false } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    res.json({
      success: true,
      data: {
        threads: threads.map(toThread),
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        popularTags: tags.map(t => ({ tag: t._id, count: t.count })),
      },
    });
  } catch (e) {
    console.error('getThreads error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// ─── GET /discuss/:id ─────────────────────────────────────────────────────────
export const getThread = async (req, res) => {
  try {
    const doc = await Discuss.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).lean();

    if (!doc || doc.isDeleted) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }

    const comments = (doc.comments || [])
      .filter(c => !c.isDeleted)
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.votes - a.votes || new Date(b.createdAt) - new Date(a.createdAt);
      });

    res.json({ success: true, data: { ...toThread(doc), comments } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ─── POST /discuss ────────────────────────────────────────────────────────────
export const createThread = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { title, body, category = 'discussion', tags = [], problemId, problemTitle, contestId } = req.body;
    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({ success: false, message: 'Title and body are required' });
    }

    const meta = await getUserMeta(userId);
    const thread = await Discuss.create({
      title: title.trim(),
      body: body.trim(),
      author: userId,
      authorName: meta.name,
      authorAvatar: meta.avatar,
      category,
      tags: (Array.isArray(tags) ? tags : []).slice(0, 5).map(t => String(t).toLowerCase().trim()),
      problemId: problemId || null,
      problemTitle: problemTitle || null,
      contestId: contestId ? Number(contestId) : null,
    });

    res.status(201).json({ success: true, data: toThread(thread.toObject()) });
  } catch (e) {
    console.error('createThread error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// ─── PUT /discuss/:id ─────────────────────────────────────────────────────────
export const updateThread = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const doc = await Discuss.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    if (doc.author.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { title, body, tags, category } = req.body;
    if (title) doc.title = title.trim();
    if (body)  doc.body  = body.trim();
    if (tags)  doc.tags  = tags.map(t => t.toLowerCase().trim()).slice(0, 5);
    if (category) doc.category = category;
    await doc.save();

    res.json({ success: true, data: toThread(doc.toObject()) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ─── DELETE /discuss/:id ──────────────────────────────────────────────────────
export const deleteThread = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const doc = await Discuss.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    if (doc.author.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    doc.isDeleted = true;
    await doc.save();
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ─── POST /discuss/:id/vote ───────────────────────────────────────────────────
export const voteThread = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const doc = await Discuss.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });

    const voterIdx = doc.voters.findIndex(v => v.toString() === userId);
    if (voterIdx !== -1) {
      // Already voted — toggle off
      doc.voters.splice(voterIdx, 1);
      doc.votes = Math.max(0, doc.votes - 1);
    } else {
      doc.voters.push(userId);
      doc.votes += 1;
    }
    await doc.save();
    res.json({ success: true, data: { votes: doc.votes } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ─── POST /discuss/:id/comments ──────────────────────────────────────────────
export const addComment = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ success: false, message: 'Comment body required' });

    const doc = await Discuss.findById(req.params.id);
    if (!doc || doc.isDeleted) return res.status(404).json({ success: false, message: 'Thread not found' });
    if (doc.isLocked) return res.status(403).json({ success: false, message: 'Thread is locked' });

    const meta = await getUserMeta(userId);
    doc.comments.push({
      author: userId,
      authorName: meta.name,
      authorAvatar: meta.avatar,
      body: body.trim(),
    });
    await doc.save();
    const newComment = doc.comments[doc.comments.length - 1];
    res.status(201).json({ success: true, data: newComment });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ─── PUT /discuss/:id/comments/:commentId ────────────────────────────────────
export const updateComment = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const doc = await Discuss.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Thread not found' });

    const comment = doc.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.author.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    comment.body = req.body.body?.trim() || comment.body;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await doc.save();
    res.json({ success: true, data: comment });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ─── POST /discuss/:id/comments/:commentId/vote ──────────────────────────────
export const voteComment = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const doc = await Discuss.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Thread not found' });

    const comment = doc.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const voterIdx = comment.voters.findIndex(v => v.toString() === userId);
    if (voterIdx !== -1) {
      comment.voters.splice(voterIdx, 1);
      comment.votes = Math.max(0, comment.votes - 1);
    } else {
      comment.voters.push(userId);
      comment.votes += 1;
    }
    await doc.save();
    res.json({ success: true, data: { votes: comment.votes } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ─── GET /discuss/stats ───────────────────────────────────────────────────────
export const getStats = async (req, res) => {
  try {
    const [total, today, totalComments] = await Promise.all([
      Discuss.countDocuments({ isDeleted: false }),
      Discuss.countDocuments({
        isDeleted: false,
        createdAt: { $gte: new Date(Date.now() - 86400000) },
      }),
      Discuss.aggregate([
        { $match: { isDeleted: false } },
        { $project: { commentCount: { $size: '$comments' } } },
        { $group: { _id: null, total: { $sum: '$commentCount' } } },
      ]),
    ]);

    const topContributors = await Discuss.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$author', name: { $first: '$authorName' }, posts: { $sum: 1 }, totalVotes: { $sum: '$votes' } } },
      { $sort: { totalVotes: -1, posts: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      data: {
        totalPosts: total,
        postsToday: today,
        totalComments: totalComments[0]?.total || 0,
        topContributors: topContributors.map(c => ({
          id: c._id, name: c.name, posts: c.posts, totalVotes: c.totalVotes,
        })),
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};