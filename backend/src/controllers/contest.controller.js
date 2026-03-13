import Contest from '../models/postgres/Contest.models.js';
import ContestParticipant from '../models/postgres/ContestParticipant.models.js';
import ContestSubmission from '../models/postgres/ContestSubmission.models.js';
import Problem from '../models/problem.models.js';
import User from '../models/user.models.js';
import Submission from '../models/submission.models.js';
import { Op } from 'sequelize';
import { sequelize } from '../db/postgres/index.js';
import redis from '../config/redis.config.js';
import mongoose from 'mongoose';
import axios from 'axios';

// ─── Rating helpers (Elo-style, Codeforces-inspired) ─────────────────────────
const BASE_RATING = 1500;

function expectedScore(rA, rB) { return 1 / (1 + Math.pow(10, (rB - rA) / 400)); }

async function computeAndApplyRatings(contestId) {
  try {
    const participants = await ContestParticipant.findAll({
      where: { contest_id: contestId, is_disqualified: false },
      order: [['score','DESC'],['penalty','ASC'],['joined_at','ASC']]
    });
    if (participants.length < 2) return;

    const n = participants.length;
    const expectedRanks = participants.map((p, i) => {
      let expected = 1;
      for (let j = 0; j < n; j++) {
        if (i !== j) expected += expectedScore(participants[j].rating_before, p.rating_before);
      }
      return expected;
    });

    const K = 32;
    for (let i = 0; i < n; i++) {
      const p = participants[i];
      const actualRank = i + 1;
      const expRank = expectedRanks[i];
      const delta = Math.round(K * (expRank - actualRank) / n * 10);
      const newRating = Math.max(100, p.rating_before + delta);
      await p.update({ rating_after: newRating, rating_change: delta, rank: actualRank });
      await User.findByIdAndUpdate(p.user_id, {
        $inc: { 'stats.score': delta > 0 ? delta : 0 },
        $set: { 'stats.rating': newRating }
      });
    }
  } catch (e) {
    console.error('Rating computation error:', e.message);
  }
}

function calculateIOIScore(problemPoints, passed, total) {
  if (!total) return 0;
  return Math.round((passed / total) * problemPoints);
}

function calculateAtcoderScore(problemPoints, timeFromStart, totalDuration) {
  const timeRatio = timeFromStart / totalDuration;
  return Math.round(problemPoints * Math.max(0.3, 1 - 0.7 * timeRatio));
}

function getDefaultPoints(difficulty) {
  if (difficulty === 'easy') return 100;
  if (difficulty === 'medium') return 200;
  if (difficulty === 'hard') return 300;
  return 100;
}

// ─── GET /api/v1/contests ─────────────────────────────────────────────────────
export const getContests = async (req, res) => {
  try {
    const { status, type, page=1, limit=50 } = req.query;
    const where = {};
    const now = new Date();
    if (status === 'upcoming') where.start_time = { [Op.gt]: now };
    else if (status === 'live') { where.start_time = {[Op.lte]:now}; where.end_time = {[Op.gte]:now}; }
    else if (status === 'past') where.end_time = { [Op.lt]: now };
    if (type) where.contest_type = type;

    const offset = (page-1)*limit;
    const { rows, count } = await Contest.findAndCountAll({
      where, limit: parseInt(limit), offset: parseInt(offset),
      order: [['start_time','DESC']],
      attributes: { exclude: ['registration_password'] }
    });

    const userId = req.user?.id || req.user?._id?.toString();
    const contestsData = await Promise.all(rows.map(async c => {
      const [participantCount, participant] = await Promise.all([
        ContestParticipant.count({ where: { contest_id: c.id } }),
        userId ? ContestParticipant.findOne({ where: { contest_id: c.id, user_id: userId } }) : null
      ]);
      return {
        ...c.toJSON(),
        participantsCount: participantCount,
        problemsCount: (c.problem_ids||[]).length,
        isRegistered: !!participant,
        startTime: c.start_time, endTime: c.end_time,
        duration: c.duration_minutes, currentStatus: c.getStatus()
      };
    }));

    res.json({ success: true, data: contestsData, total: count, page: parseInt(page), pages: Math.ceil(count/limit) });
  } catch(e) {
    console.error('getContests error:', e);
    res.status(500).json({ success: false, message: 'Failed to fetch contests', error: e.message });
  }
};

// ─── GET /api/v1/contests/my ──────────────────────────────────────────────────
// Returns contests the user has registered for OR created
export const getMyContests = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id?.toString();
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    // Contests the user is registered for
    const participations = await ContestParticipant.findAll({
      where: { user_id: userId },
      attributes: ['contest_id', 'score', 'rank', 'problems_solved', 'joined_at']
    });
    const registeredIds = participations.map(p => p.contest_id);

    // Contests the user created (organizer/admin)
    const [registered, created] = await Promise.all([
      registeredIds.length > 0
        ? Contest.findAll({
            where: { id: { [Op.in]: registeredIds } },
            attributes: { exclude: ['registration_password'] },
            order: [['start_time', 'DESC']]
          })
        : Promise.resolve([]),
      Contest.findAll({
        where: { created_by: userId },
        attributes: { exclude: ['registration_password'] },
        order: [['start_time', 'DESC']]
      })
    ]);

    // Merge and deduplicate
    const allContests = [...registered];
    for (const c of created) {
      if (!allContests.find(x => x.id === c.id)) allContests.push(c);
    }

    // Build participation map
    const partMap = {};
    participations.forEach(p => { partMap[p.contest_id] = p; });

    const result = allContests.map(c => {
      const part = partMap[c.id];
      return {
        ...c.toJSON(),
        startTime: c.start_time,
        endTime: c.end_time,
        duration: c.duration_minutes,
        currentStatus: c.getStatus(),
        problemsCount: (c.problem_ids || []).length,
        isRegistered: !!part,
        isCreator: c.created_by === userId,
        myScore: part?.score || 0,
        myRank: part?.rank || null,
        mySolved: part?.problems_solved || 0,
        joinedAt: part?.joined_at || null,
      };
    });

    res.json({ success: true, data: result, total: result.length });
  } catch (e) {
    console.error('getMyContests error:', e);
    res.status(500).json({ success: false, message: 'Failed to fetch your contests', error: e.message });
  }
};

// ─── GET /api/v1/contests/:id ─────────────────────────────────────────────────
export const getContest = async (req, res) => {
  try {
    const { id } = req.params;
    const contest = await Contest.findByPk(id, { attributes: { exclude: ['registration_password'] } });
    if (!contest) return res.status(404).json({ success: false, message: 'Contest not found' });

    const userId = req.user?.id || req.user?._id?.toString();

    const contestStatus = contest.getStatus();
    const isLiveOrEnded = contestStatus === 'live' || contestStatus === 'ended';
    let problems = [];
    if (contest.problem_ids?.length) {
      const validIds = (contest.problem_ids || []).filter(id => mongoose.isValidObjectId(id));
      try {
        const docs = validIds.length
          ? await Problem.find({ _id: { $in: validIds } })
              .select('title slug difficulty description inputFormat outputFormat tags metadata constraints testCases timeLimit memoryLimit hints')
          : [];
        const ordered = validIds.map(pid => docs.find(d => d._id.toString() === pid)).filter(Boolean);
        problems = ordered.map((p, idx) => {
          const base = {
            _id: p._id,
            title: isLiveOrEnded ? p.title : `Problem ${String.fromCharCode(65 + idx)}`,
            slug: p.slug,
            difficulty: p.difficulty,
            tags: isLiveOrEnded ? (p.tags || []) : [],
            points: (contest.points_per_problem || {})[p._id.toString()] || getDefaultPoints(p.difficulty),
            label: String.fromCharCode(65 + idx),
            isLocked: !isLiveOrEnded,
            metadata: { acceptanceRate: p.metadata?.acceptanceRate },
          };
          if (isLiveOrEnded) {
            Object.assign(base, {
              description: p.description,
              inputFormat: p.inputFormat,
              outputFormat: p.outputFormat,
              constraints: p.constraints,
              testCases: (p.testCases || []).filter(tc => !tc.isHidden),
            });
          }
          return base;
        });
      } catch (e) { console.error('Problem fetch error:', e.message); }
    }

    const [participantCount, participant] = await Promise.all([
      ContestParticipant.count({ where: { contest_id: id } }),
      userId ? ContestParticipant.findOne({ where: { contest_id: id, user_id: userId } }) : null
    ]);

    res.json({
      success: true,
      data: {
        ...contest.toJSON(),
        problems,
        participantsCount: participantCount,
        isRegistered: !!participant,
        myScore: participant?.score || 0,
        myRank: participant?.rank || null,
        mySolved: participant?.problems_solved || 0,
        startTime: contest.start_time,
        endTime: contest.end_time,
        duration: contest.duration_minutes,
        currentStatus: contestStatus,
      }
    });
  } catch (e) {
    console.error('getContest error:', e.message);
    res.status(500).json({ success: false, message: 'Failed to fetch contest', error: e.message });
  }
};

// ─── POST /api/v1/contests ────────────────────────────────────────────────────
export const createContest = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user?.id || req.user?._id?.toString();
    const {
      title, description,
      contestType, contest_type,
      difficulty='medium',
      start_time, startTime,
      end_time, endTime,
      max_participants, maxParticipants,
      is_private=false, isPrivate,
      registration_password, registrationPassword,
      registration_open=true,
      registration_deadline,
      rules, prizes=[],
      is_rated=true, isRated,
      scoring_type='icpc', scoringType,
      penalty_minutes=20,
      allow_teams=false, allowTeams,
      max_team_size=1, maxTeamSize,
      banner_url, banner,
      tags=[], groupId, group_id,
    } = req.body;

    // Accept both camelCase (frontend) and snake_case (API)
    const resolvedType = (contestType || contest_type || 'rated').toLowerCase();
    const resolvedStart = start_time || startTime;
    const resolvedEnd = end_time || endTime;

    if (!title || !resolvedStart || !resolvedEnd) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'title, start_time, end_time are required' });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g,'-') + '-' + Date.now();

    const contest = await Contest.create({
      title,
      slug,
      description,
      contest_type: resolvedType,
      difficulty: difficulty || 'mixed',
      start_time: resolvedStart,
      end_time: resolvedEnd,
      max_participants: max_participants || maxParticipants || null,
      is_private: is_private || isPrivate || false,
      registration_password: (is_private || isPrivate) ? (registration_password || registrationPassword) : null,
      registration_open,
      registration_deadline: registration_deadline || null,
      rules: rules || null,
      prizes: Array.isArray(prizes) ? prizes : [],
      is_rated: is_rated !== undefined ? is_rated : (isRated !== undefined ? isRated : true),
      scoring_type: scoring_type || scoringType || 'icpc',
      penalty_minutes: penalty_minutes || 20,
      allow_teams: allow_teams || allowTeams || false,
      max_team_size: max_team_size || maxTeamSize || 1,
      banner_url: banner_url || banner || null,
      tags: Array.isArray(tags) ? tags : [],
      created_by: userId,
      group_id: group_id || groupId || null,
      status: new Date(resolvedStart) > new Date() ? 'upcoming' : 'live'
    }, { transaction: t });

    await t.commit();
    res.status(201).json({
      success: true,
      data: {
        ...contest.toJSON(),
        startTime: contest.start_time,
        endTime: contest.end_time,
        duration: contest.duration_minutes,
        currentStatus: contest.getStatus(),
      },
      message: 'Contest created successfully'
    });
  } catch(e) {
    await t.rollback();
    console.error('createContest error:', e);
    res.status(500).json({ success: false, message: 'Failed to create contest', error: e.message });
  }
};

// ─── PUT /api/v1/contests/:id ─────────────────────────────────────────────────
export const updateContest = async (req, res) => {
  try {
    const { id } = req.params;
    const contest = await Contest.findByPk(id);
    if (!contest) return res.status(404).json({ success: false, message: 'Contest not found' });
    const allowed = ['title','description','contest_type','difficulty','start_time','end_time',
      'max_participants','is_private','registration_password','registration_open','registration_deadline',
      'rules','prizes','is_rated','scoring_type','penalty_minutes','allow_teams','max_team_size',
      'banner_url','tags','editorial','status','group_id'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    await contest.update(updates);
    res.json({ success: true, data: contest });
  } catch(e) {
    res.status(500).json({ success: false, message: 'Failed to update contest', error: e.message });
  }
};

// ─── DELETE /api/v1/contests/:id ─────────────────────────────────────────────
export const deleteContest = async (req, res) => {
  try {
    const { id } = req.params;
    const contest = await Contest.findByPk(id);
    if (!contest) return res.status(404).json({ success: false, message: 'Contest not found' });
    await contest.destroy();
    res.json({ success: true, message: 'Contest deleted' });
  } catch(e) {
    res.status(500).json({ success: false, message: 'Failed to delete contest', error: e.message });
  }
};

// ─── POST /api/v1/contests/:id/problems ──────────────────────────────────────
export const addProblemsToContest = async (req, res) => {
  try {
    const { id } = req.params;
    const problemIds = req.body.problemIds || req.body.problem_ids || [];
    const points = req.body.points || req.body.pointsMap || {};

    if (!Array.isArray(problemIds) || problemIds.length === 0) {
      return res.status(400).json({ success: false, message: 'problemIds array is required' });
    }

    const contest = await Contest.findByPk(id);
    if (!contest) return res.status(404).json({ success: false, message: 'Contest not found' });

    const existing = contest.problem_ids || [];
    const newIds = [...new Set([...existing, ...problemIds.map(String)])];
    const newPoints = { ...(contest.points_per_problem || {}), ...(points || {}) };

    await contest.update({ problem_ids: newIds, points_per_problem: newPoints });
    res.json({ success: true, data: { id: contest.id, problemsCount: newIds.length }, message: `${problemIds.length} problem(s) added` });
  } catch(e) {
    res.status(500).json({ success: false, message: 'Failed to add problems', error: e.message });
  }
};

// ─── POST /api/v1/contests/:id/register ──────────────────────────────────────
export const registerForContest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id?.toString();
    const { password } = req.body;

    const contest = await Contest.findByPk(id);
    if (!contest) return res.status(404).json({ success: false, message: 'Contest not found' });
    if (contest.hasEnded()) return res.status(400).json({ success: false, message: 'Contest has ended' });
    if (!contest.registration_open) return res.status(400).json({ success: false, message: 'Registration is closed' });
    if (contest.is_private && contest.registration_password !== password)
      return res.status(400).json({ success: false, message: 'Invalid password' });

    const existing = await ContestParticipant.findOne({ where: { contest_id: id, user_id: userId } });
    if (existing) return res.status(400).json({ success: false, message: 'Already registered' });

    const mongoUser = await User.findById(userId).select('stats.rating').lean();
    const participant = await ContestParticipant.create({
      contest_id: id,
      user_id: userId,
      rating_before: mongoUser?.stats?.rating || 1500,
      joined_at: new Date()
    });

    res.json({ success: true, data: participant, message: 'Successfully registered!' });
  } catch(e) {
    console.error('registerForContest error:', e);
    res.status(500).json({ success: false, message: 'Registration failed', error: e.message });
  }
};

// ─── POST /api/v1/contests/:id/submit ────────────────────────────────────────
export const submitContestSolution = async (req, res) => {
  try {
    const { id: contestId } = req.params;
    const { problemId, language, submissionId } = req.body;
    const userId = req.user?.id || req.user?._id?.toString();

    const contest = await Contest.findByPk(contestId);
    if (!contest) return res.status(404).json({ success: false, message: 'Contest not found' });
    const now = new Date();
    if (!contest.isLive()) return res.status(400).json({ success: false, message: 'Contest is not live' });

    const participant = await ContestParticipant.findOne({ where: { contest_id: contestId, user_id: userId } });
    if (!participant) return res.status(403).json({ success: false, message: 'Not registered for this contest' });

    let verdict = 'pending', runtime = 0, memory = 0, passed = 0, total = 0;
    if (submissionId) {
      const sub = await Submission.findById(submissionId);
      if (sub) {
        verdict = sub.verdict; runtime = sub.runtime || 0; memory = sub.memoryUsed || 0;
        passed = sub.passedTestCases || 0; total = sub.totalTestCases || 0;
      }
    }

    const timeFromStart = Math.floor((now - new Date(contest.start_time)) / 60000);
    const totalDuration = contest.duration_minutes || 120;
    const problemPoints = (contest.points_per_problem||{})[problemId] ||
      getDefaultPoints((await Problem.findById(problemId).select('difficulty'))?.difficulty);

    const alreadyAccepted = await ContestSubmission.findOne({
      where: { contest_id: contestId, user_id: userId, problem_id: problemId, status: 'accepted' }
    });

    let pointsEarned = 0;
    if (verdict === 'accepted' && !alreadyAccepted) {
      if (contest.scoring_type === 'icpc') pointsEarned = problemPoints;
      else if (contest.scoring_type === 'ioi') pointsEarned = calculateIOIScore(problemPoints, passed, total);
      else if (contest.scoring_type === 'atcoder') pointsEarned = calculateAtcoderScore(problemPoints, timeFromStart, totalDuration);
      else pointsEarned = Math.round(problemPoints * Math.max(0.5, 1 - 0.002 * timeFromStart));
    }

    const contestSub = await ContestSubmission.create({
      contest_id: contestId, user_id: userId, problem_id: problemId,
      submission_id: submissionId || `cs_${Date.now()}`,
      language, status: verdict, score: pointsEarned,
      time_taken: runtime, memory_used: memory,
      time_from_start: timeFromStart, submitted_at: now
    });

    await updateParticipantStats(contestId, userId, problemId, verdict, timeFromStart, contest);
    res.json({ success: true, data: { submission: contestSub, verdict, pointsEarned } });
  } catch(e) {
    console.error('submitContestSolution error:', e);
    res.status(500).json({ success: false, message: 'Submission failed', error: e.message });
  }
};

// ─── GET /api/v1/contests/:id/leaderboard ────────────────────────────────────
export const getContestLeaderboard = async (req, res) => {
  try {
    const { id: contestId } = req.params;
    const cacheKey = `contest:${contestId}:lb`;
    if (redis?.get) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return res.json({ success: true, data: JSON.parse(cached), cached: true });
      } catch {}
    }
    const lb = await getLeaderboardData(contestId);
    if (redis?.setex) { try { await redis.setex(cacheKey, 15, JSON.stringify(lb)); } catch {} }
    res.json({ success: true, data: lb });
  } catch(e) {
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard', error: e.message });
  }
};

// ─── GET /api/v1/contests/:id/submissions ────────────────────────────────────
export const getContestSubmissions = async (req, res) => {
  try {
    const { id: contestId } = req.params;
    const userId = req.user?.id || req.user?._id?.toString();
    const subs = await ContestSubmission.findAll({
      where: { contest_id: contestId, user_id: userId },
      order: [['submitted_at','DESC']]
    });
    const problemIds = [...new Set(subs.map(s=>s.problem_id))];
    const problems = await Problem.find({ _id: { $in: problemIds } }).select('title');
    const pMap = Object.fromEntries(problems.map(p => [p._id.toString(), p.title]));
    res.json({ success: true, submissions: subs.map(s => ({ ...s.toJSON(), problemTitle: pMap[s.problem_id] || 'Unknown' })) });
  } catch(e) {
    res.status(500).json({ success: false, message: 'Failed to fetch submissions', error: e.message });
  }
};

// ─── POST /api/v1/contests/:id/end ───────────────────────────────────────────
export const endContest = async (req, res) => {
  try {
    const { id } = req.params;
    const contest = await Contest.findByPk(id);
    if (!contest) return res.status(404).json({ success: false, message: 'Contest not found' });
    await contest.update({ status: 'ended' });
    if (contest.is_rated) await computeAndApplyRatings(id);
    res.json({ success: true, message: 'Contest ended and ratings applied' });
  } catch(e) {
    res.status(500).json({ success: false, message: 'Failed to end contest', error: e.message });
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function getLeaderboardData(contestId) {
  try {
    const participants = await ContestParticipant.findAll({
      where: { contest_id: contestId, is_disqualified: false },
      order: [['score','DESC'],['penalty','ASC'],['joined_at','ASC']]
    });
    if (!participants.length) return [];

    const validIds = participants.map(p => p.user_id).filter(id => mongoose.isValidObjectId(id));
    let userMap = {};
    if (validIds.length) {
      try {
        const users = await User.find({ _id: { $in: validIds } }).select('username profile.avatar').lean();
        users.forEach(u => { userMap[u._id.toString()] = u; });
      } catch (e) { console.error('Leaderboard user fetch error:', e.message); }
    }

    return participants.map((p, idx) => {
      const u = userMap[p.user_id] || null;
      return {
        rank: idx+1, userId: p.user_id,
        username: u?.username || `User_${(p.user_id||'').slice(-6)}`,
        avatar: u?.profile?.avatar || null,
        score: p.score||0, penalty: p.penalty||0,
        problemsSolved: p.problems_solved||0, totalTime: p.total_time||0,
        problemStats: p.problem_stats||{},
        ratingBefore: p.rating_before, ratingAfter: p.rating_after,
        ratingChange: p.rating_change, joinedAt: p.joined_at
      };
    });
  } catch(e) {
    console.error('getLeaderboardData error:', e.message);
    return [];
  }
}

async function updateParticipantStats(contestId, userId, problemId, verdict, timeFromStart, contest) {
  const participant = await ContestParticipant.findOne({ where: { contest_id: contestId, user_id: userId } });
  if (!participant) return;

  const stats = participant.problem_stats || {};
  const ps = stats[problemId] || { attempts: 0, solved: false, solve_time: null, penalty: 0 };

  if (!ps.solved) {
    ps.attempts += 1;
    if (verdict === 'accepted') {
      ps.solved = true;
      ps.solve_time = timeFromStart;
      ps.penalty = (ps.attempts - 1) * (contest.penalty_minutes || 20);
    }
    stats[problemId] = ps;
  }

  const acceptedSubs = await ContestSubmission.findAll({
    where: { contest_id: contestId, user_id: userId, status: 'accepted' }
  });
  const uniqueSolved = new Set(acceptedSubs.map(s => s.problem_id));
  const totalScore = acceptedSubs.reduce((sum, s) => sum + (s.score||0), 0);

  let totalPenalty = 0;
  Object.values(stats).forEach(ps => {
    if (ps.solved) totalPenalty += (ps.solve_time||0) + (ps.penalty||0);
  });

  await participant.update({
    score: totalScore,
    problems_solved: uniqueSolved.size,
    penalty: totalPenalty,
    problem_stats: stats,
    last_submission_at: new Date()
  });

  if (redis?.del) { try { await redis.del(`contest:${contestId}:lb`); } catch {} }
}

export default {
  getContests, getMyContests, getContest, createContest, updateContest, deleteContest,
  addProblemsToContest, registerForContest, submitContestSolution,
  getContestLeaderboard, getContestSubmissions, endContest
};