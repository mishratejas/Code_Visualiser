import { emitLeaderboardUpdate, emitContestStatus } from '../socket/contestSocket.js';
import redis from '../config/redis.config.js';
import Contest from '../models/postgres/Contest.models.js';
import ContestParticipant from '../models/postgres/ContestParticipant.models.js';
import ContestSubmission from '../models/postgres/ContestSubmission.models.js';
import User from '../models/postgres/User.models.js';
import { Op } from 'sequelize';

// @desc    Get all contests
// @route   GET /api/v1/contests
export const getContests = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    
    const where = {};
    
    // Filter by status
    if (status) {
      where.status = status;
    }
    
    // Filter by type
    if (type) {
      where.contest_type = type;
    }
    
    const offset = (page - 1) * limit;
    
    const contests = await Contest.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['start_time', 'DESC']],
      attributes: { exclude: ['registration_password'] }
    });
    
    res.json({
      success: true,
      data: contests.rows,
      pagination: {
        total: contests.count,
        page: parseInt(page),
        pages: Math.ceil(contests.count / limit)
      }
    });
  } catch (error) {
    console.error('Get contests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contests' });
  }
};

// @desc    Get single contest
// @route   GET /api/v1/contests/:id
export const getContest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const contest = await Contest.findByPk(id, {
      attributes: { exclude: ['registration_password'] },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        }
      ]
    });
    
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }
    
    // Get participant count
    const participantCount = await ContestParticipant.count({
      where: { contest_id: id }
    });
    
    res.json({
      success: true,
      data: {
        ...contest.toJSON(),
        participantCount
      }
    });
  } catch (error) {
    console.error('Get contest error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contest' });
  }
};

// @desc    Create new contest
// @route   POST /api/v1/contests
export const createContest = async (req, res) => {
  try {
    const {
      title,
      slug,
      description,
      contest_type,
      start_time,
      end_time,
      duration_minutes,
      max_participants,
      registration_open,
      is_private,
      registration_password,
      banner_url,
      tags
    } = req.body;
    
    // Check if slug already exists
    const existingContest = await Contest.findOne({ where: { slug } });
    if (existingContest) {
      return res.status(400).json({ success: false, message: 'Contest slug already exists' });
    }
    
    // Create contest
    const contest = await Contest.create({
      title,
      slug,
      description,
      contest_type: contest_type || 'practice',
      status: 'draft',
      start_time,
      end_time,
      duration_minutes,
      max_participants,
      registration_open: registration_open !== false,
      is_private: is_private || false,
      registration_password,
      banner_url,
      tags: tags || [],
      created_by: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: contest,
      message: 'Contest created successfully'
    });
  } catch (error) {
    console.error('Create contest error:', error);
    res.status(500).json({ success: false, message: 'Failed to create contest' });
  }
};

// @desc    Update contest
// @route   PUT /api/v1/contests/:id
export const updateContest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const contest = await Contest.findByPk(id);
    
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }
    
    // Check if user is creator (or admin)
    if (contest.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this contest' });
    }
    
    // Update contest
    await contest.update(req.body);
    
    res.json({
      success: true,
      data: contest,
      message: 'Contest updated successfully'
    });
  } catch (error) {
    console.error('Update contest error:', error);
    res.status(500).json({ success: false, message: 'Failed to update contest' });
  }
};

// @desc    Delete contest
// @route   DELETE /api/v1/contests/:id
export const deleteContest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const contest = await Contest.findByPk(id);
    
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }
    
    // Check if user is creator (or admin)
    if (contest.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this contest' });
    }
    
    await contest.destroy();
    
    res.json({
      success: true,
      message: 'Contest deleted successfully'
    });
  } catch (error) {
    console.error('Delete contest error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete contest' });
  }
};

// @desc    Register for contest
// @route   POST /api/v1/contests/:id/register
export const registerForContest = async (req, res) => {
  const { id: contestId } = req.params;
  const userId = req.user.id;
  const { password } = req.body;

  try {
    const contest = await Contest.findByPk(contestId);
    
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    // Check if contest has started
    if (new Date() > contest.start_time) {
      return res.status(400).json({ success: false, message: 'Contest has already started' });
    }

    // Check registration status
    if (!contest.registration_open) {
      return res.status(400).json({ success: false, message: 'Registration is closed' });
    }

    // Check private contest password
    if (contest.is_private && password !== contest.registration_password) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Check if already registered
    const existing = await ContestParticipant.findOne({
      where: { contest_id: contestId, user_id: userId }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Already registered' });
    }

    // Register user
    await ContestParticipant.create({
      contest_id: contestId,
      user_id: userId,
      joined_at: new Date()
    });

    res.json({ success: true, message: 'Successfully registered for contest' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

// @desc    Submit solution during contest
// @route   POST /api/v1/contests/:id/submit
export const submitContestSolution = async (req, res) => {
  const { id: contestId } = req.params;
  const userId = req.user.id;
  const { problemId, code, language } = req.body;

  try {
    const contest = await Contest.findByPk(contestId);
    const now = new Date();

    // Verify contest is live
    if (now < contest.start_time || now > contest.end_time) {
      return res.status(400).json({ success: false, message: 'Contest is not active' });
    }

    // Check if user is registered
    const participant = await ContestParticipant.findOne({
      where: { contest_id: contestId, user_id: userId }
    });

    if (!participant) {
      return res.status(403).json({ success: false, message: 'Not registered for contest' });
    }

    // TODO: Execute code (integrate with your code execution service)
    // const submissionResult = await executeCode(code, language, problemId);
    
    // For now, mock result
    const submissionResult = {
      submissionId: `sub_${Date.now()}`,
      verdict: 'Accepted',
      runtime: 100,
      memory: 2048
    };

    // Calculate time from contest start
    const timeFromStart = Math.floor((now - contest.start_time) / 60000); // minutes

    // Calculate points
    let pointsEarned = 0;
    if (submissionResult.verdict === 'Accepted') {
      pointsEarned = calculatePoints(problemId, timeFromStart, contest.contest_type);
    }

    // Save contest submission
    const contestSub = await ContestSubmission.create({
      contest_id: contestId,
      user_id: userId,
      problem_id: problemId,
      submission_id: submissionResult.submissionId,
      language,
      status: submissionResult.verdict,
      score: pointsEarned,
      time_taken: submissionResult.runtime,
      memory_used: submissionResult.memory,
      submitted_at: now
    });

    // Update participant score
    await updateParticipantScore(contestId, userId);

    res.json({
      success: true,
      data: {
        submission: contestSub,
        verdict: submissionResult.verdict,
        pointsEarned
      }
    });
  } catch (error) {
    console.error('Contest submission error:', error);
    res.status(500).json({ success: false, message: 'Submission failed' });
  }
};

// @desc    Get live leaderboard
// @route   GET /api/v1/contests/:id/leaderboard
export const getContestLeaderboard = async (req, res) => {
  const { id: contestId } = req.params;

  try {
    // Check Redis cache first
    const cacheKey = `contest:${contestId}:leaderboard`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json({ success: true, data: JSON.parse(cached) });
    }

    // Fetch from database
    const participants = await ContestParticipant.findAll({
      where: { contest_id: contestId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email']
      }],
      order: [
        ['score', 'DESC'],
        ['total_time', 'ASC'],
        ['joined_at', 'ASC']
      ]
    });

    // Add rank
    const leaderboard = participants.map((p, index) => ({
      rank: index + 1,
      userId: p.user_id,
      username: p.user?.username || 'Unknown',
      score: p.score,
      problemsSolved: p.problems_solved,
      totalTime: p.total_time
    }));

    // Cache for 10 seconds
    await redis.setex(cacheKey, 10, JSON.stringify(leaderboard));

    res.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
  }
};

// Helper functions
async function updateParticipantScore(contestId, userId) {
  const submissions = await ContestSubmission.findAll({
    where: {
      contest_id: contestId,
      user_id: userId,
      status: 'Accepted'
    }
  });

  const totalScore = submissions.reduce((sum, sub) => sum + sub.score, 0);
  const problemsSolved = new Set(submissions.map(s => s.problem_id)).size;

  await ContestParticipant.update({
    score: totalScore,
    problems_solved: problemsSolved
  }, {
    where: { contest_id: contestId, user_id: userId }
  });
}

function calculatePoints(problemId, timeFromStart, scoringType) {
  const basePoints = 100;
  
  if (scoringType === 'time') {
    return Math.max(basePoints - timeFromStart, 10);
  }
  
  return basePoints;
}