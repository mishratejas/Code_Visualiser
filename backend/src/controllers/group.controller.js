import Group from '../models/postgres/Group.models.js';
import GroupMember from '../models/postgres/GroupMember.models.js';
import Contest from '../models/postgres/Contest.models.js';
import User from '../models/user.models.js';
import { Op } from 'sequelize';
import sequelize from '../db/postgres/index.js';

// ── helpers ──────────────────────────────────────────────────────────────────
const resolveId = (req) => req.user?.id || req.user?._id?.toString();

const enrichGroupForUser = async (group, userId) => {
  const obj = group.toJSON ? group.toJSON() : { ...group };
  if (!userId) return { ...obj, isMember: false, myRole: null };
  const m = await GroupMember.findOne({ where: { group_id: obj.id, user_id: userId, status: 'active' } });
  return { ...obj, isMember: !!m, myRole: m?.role || null };
};

// ── GET /api/v1/groups ────────────────────────────────────────────────────────
export const getGroups = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, type, my } = req.query;
    const userId = resolveId(req);
    const where = { is_active: true };

    if (my === 'true' && userId) {
      const memberships = await GroupMember.findAll({
        where: { user_id: userId, status: 'active' }, attributes: ['group_id']
      });
      where.id = { [Op.in]: memberships.map(m => m.group_id) };
    } else {
      where.visibility = { [Op.in]: ['public', 'private'] };
    }

    if (search) where.name = { [Op.iLike]: `%${search}%` };
    if (type) where.type = type;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows, count } = await Group.findAndCountAll({
      where,
      attributes: { exclude: ['join_password'] },
      order: [['member_count', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    const data = await Promise.all(rows.map(g => enrichGroupForUser(g, userId)));
    res.json({ success: true, data, total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) });
  } catch (e) {
    console.error('getGroups error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// ── GET /api/v1/groups/:id ────────────────────────────────────────────────────
export const getGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = resolveId(req);

    const group = await Group.findByPk(id, { attributes: { exclude: ['join_password'] } });
    if (!group || !group.is_active) return res.status(404).json({ success: false, message: 'Group not found' });

    if (group.visibility === 'secret') {
      if (!userId) return res.status(403).json({ success: false, message: 'Access denied' });
      const m = await GroupMember.findOne({ where: { group_id: id, user_id: userId, status: 'active' } });
      if (!m) return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get members
    const members = await GroupMember.findAll({
      where: { group_id: id, status: 'active' },
      order: [['joined_at', 'ASC']],
      limit: 100
    });

    const validIds = members.map(m => m.user_id).filter(uid => uid && uid.length === 24);
    let userMap = {};
    if (validIds.length) {
      const mongoUsers = await User.find({ _id: { $in: validIds } })
        .select('username profile.name profile.avatar stats.totalProblemsSolved stats.rating').lean();
      mongoUsers.forEach(u => { userMap[u._id.toString()] = u; });
    }

    const enrichedMembers = members.map(m => {
      const u = userMap[m.user_id] || null;
      return {
        userId: m.user_id,
        username: u?.username || `User_${m.user_id.slice(-6)}`,
        name: u?.profile?.name || null,
        avatar: u?.profile?.avatar || null,
        totalSolved: u?.stats?.totalProblemsSolved || 0,
        rating: u?.stats?.rating || 1500,
        role: m.role,
        joinedAt: m.joined_at,
      };
    });

    // Get group contests
    const contests = await Contest.findAll({
      where: { group_id: id },
      attributes: { exclude: ['registration_password'] },
      order: [['start_time', 'DESC']],
      limit: 20
    });

    const enriched = await enrichGroupForUser(group, userId);
    res.json({
      success: true,
      data: {
        ...enriched,
        members: enrichedMembers,
        contests: contests.map(c => ({
          ...c.toJSON(),
          currentStatus: c.getStatus(),
          startTime: c.start_time,
          endTime: c.end_time,
          duration: c.duration_minutes,
          problemsCount: (c.problem_ids || []).length,
        })),
      }
    });
  } catch (e) {
    console.error('getGroup error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// ── POST /api/v1/groups ───────────────────────────────────────────────────────
export const createGroup = async (req, res) => {
  try {
    const userId = resolveId(req);
    const { name, description, type = 'group', visibility = 'public', join_password, tags = [], website, country, avatar_url } = req.body;

    if (!name?.trim()) return res.status(400).json({ success: false, message: 'name is required' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now();

    const group = await Group.create({
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      type,
      visibility,
      join_password: visibility !== 'public' ? join_password || null : null,
      tags: Array.isArray(tags) ? tags : [],
      website: website || null,
      country: country || null,
      avatar_url: avatar_url || null,
      owner_id: userId,
      member_count: 1,
    });

    // Owner is automatically a member with owner role
    await GroupMember.create({
      group_id: group.id,
      user_id: userId,
      role: 'owner',
      status: 'active',
      joined_at: new Date(),
    });

    res.status(201).json({ success: true, data: { ...group.toJSON(), isMember: true, myRole: 'owner' }, message: 'Group created!' });
  } catch (e) {
    console.error('createGroup error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// ── PUT /api/v1/groups/:id ────────────────────────────────────────────────────
export const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = resolveId(req);

    const group = await Group.findByPk(id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const member = await GroupMember.findOne({ where: { group_id: id, user_id: userId, status: 'active' } });
    if (!member || !['owner', 'admin'].includes(member.role))
      return res.status(403).json({ success: false, message: 'Only admins can update group' });

    const allowed = ['name', 'description', 'type', 'visibility', 'join_password', 'tags', 'website', 'country', 'avatar_url', 'banner_url'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    await group.update(updates);

    res.json({ success: true, data: group });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ── DELETE /api/v1/groups/:id ─────────────────────────────────────────────────
export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = resolveId(req);

    const group = await Group.findByPk(id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    if (group.owner_id !== userId) return res.status(403).json({ success: false, message: 'Only owner can delete group' });

    await group.update({ is_active: false });
    res.json({ success: true, message: 'Group deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ── POST /api/v1/groups/:id/join ──────────────────────────────────────────────
export const joinGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = resolveId(req);
    // Guard: req.body may be undefined if Content-Type header is missing
    const { password } = req.body || {};

    const group = await Group.findByPk(id);
    if (!group || !group.is_active) return res.status(404).json({ success: false, message: 'Group not found' });

    if (group.visibility === 'secret') return res.status(403).json({ success: false, message: 'Cannot join secret groups directly — ask a member to invite you' });

    // For private groups: verify password, then create as pending (owner must approve)
    if (group.visibility === 'private') {
      if (!password || group.join_password !== password)
        return res.status(400).json({ success: false, message: 'Incorrect password' });
    }

    const existing = await GroupMember.findOne({ where: { group_id: id, user_id: userId } });
    if (existing) {
      if (existing.status === 'active')  return res.status(400).json({ success: false, message: 'Already a member' });
      if (existing.status === 'banned')  return res.status(403).json({ success: false, message: 'You are banned from this group' });
      if (existing.status === 'pending') return res.status(400).json({ success: false, message: 'Your join request is already pending approval' });
      // Re-activate if somehow in another state
      await existing.update({ status: 'active' });
    } else {
      // Public groups: join immediately. Private groups: create pending request (admin must approve).
      const joinStatus = group.visibility === 'private' ? 'pending' : 'active';
      await GroupMember.create({ group_id: id, user_id: userId, role: 'member', status: joinStatus, joined_at: new Date() });
      if (joinStatus === 'active') await group.increment('member_count');

      if (joinStatus === 'pending') {
        return res.json({ success: true, pending: true, message: 'Join request sent! Waiting for admin approval.' });
      }
    }

    res.json({ success: true, message: 'Joined group successfully!' });
  } catch (e) {
    console.error('joinGroup error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// ── POST /api/v1/groups/:id/approve/:userId ───────────────────────────────────
export const approveMember = async (req, res) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const adminId = resolveId(req);

    const admin = await GroupMember.findOne({ where: { group_id: id, user_id: adminId, status: 'active' } });
    if (!admin || !['owner', 'admin'].includes(admin.role))
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const pending = await GroupMember.findOne({ where: { group_id: id, user_id: targetUserId, status: 'pending' } });
    if (!pending) return res.status(404).json({ success: false, message: 'No pending request found' });

    await pending.update({ status: 'active', joined_at: new Date() });
    await Group.increment('member_count', { where: { id } });

    res.json({ success: true, message: 'Member approved!' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ── POST /api/v1/groups/:id/reject/:userId ────────────────────────────────────
export const rejectMember = async (req, res) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const adminId = resolveId(req);

    const admin = await GroupMember.findOne({ where: { group_id: id, user_id: adminId, status: 'active' } });
    if (!admin || !['owner', 'admin'].includes(admin.role))
      return res.status(403).json({ success: false, message: 'Not authorized' });

    await GroupMember.destroy({ where: { group_id: id, user_id: targetUserId, status: 'pending' } });
    res.json({ success: true, message: 'Request rejected' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ── GET /api/v1/groups/:id/pending ────────────────────────────────────────────
export const getPendingMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = resolveId(req);

    const admin = await GroupMember.findOne({ where: { group_id: id, user_id: adminId, status: 'active' } });
    if (!admin || !['owner', 'admin'].includes(admin.role))
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const pending = await GroupMember.findAll({ where: { group_id: id, status: 'pending' } });

    const validIds = pending.map(m => m.user_id).filter(uid => uid && uid.length === 24);
    let userMap = {};
    if (validIds.length) {
      const users = await User.find({ _id: { $in: validIds } }).select('username profile.name profile.avatar').lean();
      users.forEach(u => { userMap[u._id.toString()] = u; });
    }

    const result = pending.map(m => {
      const u = userMap[m.user_id] || null;
      return { userId: m.user_id, username: u?.username || `User_${m.user_id.slice(-6)}`, avatar: u?.profile?.avatar || null, requestedAt: m.joined_at };
    });

    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = resolveId(req);

    const group = await Group.findByPk(id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    if (group.owner_id === userId) return res.status(400).json({ success: false, message: 'Owner cannot leave. Transfer ownership or delete the group.' });

    const member = await GroupMember.findOne({ where: { group_id: id, user_id: userId, status: 'active' } });
    if (!member) return res.status(400).json({ success: false, message: 'Not a member' });

    await member.destroy();
    await group.decrement('member_count');
    res.json({ success: true, message: 'Left group' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ── POST /api/v1/groups/:id/invite ────────────────────────────────────────────
export const inviteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = resolveId(req);
    const { username } = req.body;

    const member = await GroupMember.findOne({ where: { group_id: id, user_id: userId, status: 'active' } });
    if (!member || !['owner', 'admin', 'moderator'].includes(member.role))
      return res.status(403).json({ success: false, message: 'No permission to invite' });

    const targetUser = await User.findOne({ username }).lean();
    if (!targetUser) return res.status(404).json({ success: false, message: `User @${username} not found` });

    const targetId = targetUser._id.toString();
    const existing = await GroupMember.findOne({ where: { group_id: id, user_id: targetId } });
    if (existing?.status === 'active') return res.status(400).json({ success: false, message: 'User is already a member' });

    if (existing) {
      await existing.update({ status: 'active', invited_by: userId });
    } else {
      await GroupMember.create({ group_id: id, user_id: targetId, role: 'member', status: 'active', invited_by: userId, joined_at: new Date() });
      await Group.increment('member_count', { where: { id } });
    }

    res.json({ success: true, message: `@${username} has been added to the group` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ── PUT /api/v1/groups/:id/members/:userId/role ───────────────────────────────
export const updateMemberRole = async (req, res) => {
  try {
    const { id, userId: targetId } = req.params;
    const { role } = req.body;
    const userId = resolveId(req);

    const me = await GroupMember.findOne({ where: { group_id: id, user_id: userId, status: 'active' } });
    if (!me || !['owner', 'admin'].includes(me.role))
      return res.status(403).json({ success: false, message: 'No permission' });

    if (!['admin', 'moderator', 'member'].includes(role))
      return res.status(400).json({ success: false, message: 'Invalid role' });

    const target = await GroupMember.findOne({ where: { group_id: id, user_id: targetId, status: 'active' } });
    if (!target) return res.status(404).json({ success: false, message: 'Member not found' });
    if (target.role === 'owner') return res.status(403).json({ success: false, message: 'Cannot change owner role' });

    await target.update({ role });
    res.json({ success: true, message: 'Role updated' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ── DELETE /api/v1/groups/:id/members/:userId ─────────────────────────────────
export const removeMember = async (req, res) => {
  try {
    const { id, userId: targetId } = req.params;
    const userId = resolveId(req);

    const me = await GroupMember.findOne({ where: { group_id: id, user_id: userId, status: 'active' } });
    if (!me || !['owner', 'admin'].includes(me.role))
      return res.status(403).json({ success: false, message: 'No permission' });

    const target = await GroupMember.findOne({ where: { group_id: id, user_id: targetId } });
    if (!target) return res.status(404).json({ success: false, message: 'Member not found' });
    if (target.role === 'owner') return res.status(403).json({ success: false, message: 'Cannot remove owner' });

    await target.destroy();
    await Group.decrement('member_count', { where: { id } });
    res.json({ success: true, message: 'Member removed' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};