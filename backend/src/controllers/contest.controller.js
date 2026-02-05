import Contest from '../models/postgres/Contest.models.js';
import ContestParticipant from '../models/postgres/ContestParticipant.models.js';
import ContestSubmission from '../models/postgres/ContestSubmission.models.js';
import Problem from '../models/problem.models.js'; // MongoDB Problem model
import { Op } from 'sequelize';
import redis from '../config/redis.config.js';

// @desc    Get all contests
// @route   GET /api/v1/contests
export const getContests = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 100 } = req.query;
    
    const where = {};
    
    // Filter by status
    if (status) {
      const now = new Date();
      
      if (status === 'upcoming') {
        where.start_time = { [Op.gt]: now };
      } else if (status === 'ongoing') {
        where.start_time = { [Op.lte]: now };
        where.end_time = { [Op.gte]: now };
      } else if (status === 'past') {
        where.end_time = { [Op.lt]: now };
      }
    }
    
    // Filter by type
    if (type) {
      where.contest_type = type;
    }
    
    const offset = (page - 1) * limit;
    
    // ✅ FIXED: Removed User include since users are in MongoDB
    const contests = await Contest.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['start_time', 'DESC']],
      attributes: { exclude: ['registration_password'] }
    });
    
    // Get participant counts and problem counts for each contest
    const contestsWithCounts = await Promise.all(
      contests.rows.map(async (contest) => {
        const participantCount = await ContestParticipant.count({
          where: { contest_id: contest.id }
        });
        
        return {
          ...contest.toJSON(),
          participantsCount: participantCount,
          problemsCount: contest.problem_ids ? contest.problem_ids.length : 0,
          // Add frontend-friendly field names
          startTime: contest.start_time,
          endTime: contest.end_time,
          duration: contest.duration_minutes
        };
      })
    );
    
    res.json({
      success: true,
      data: contestsWithCounts,
      pagination: {
        total: contests.count,
        page: parseInt(page),
        pages: Math.ceil(contests.count / limit)
      }
    });
  } catch (error) {
    console.error('Get contests error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch contests',
      error: error.message 
    });
  }
};

// @desc    Get single contest with problems
// @route   GET /api/v1/contests/:id
export const getContest = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ FIXED: Removed User include since users are in MongoDB
    const contest = await Contest.findByPk(id, {
      attributes: { exclude: ['registration_password'] }
    });
    
    if (!contest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contest not found' 
      });
    }
    
    // Get participant count
    const participantCount = await ContestParticipant.count({
      where: { contest_id: id }
    });
    
    // Fetch actual problems from MongoDB
    let problems = [];
    if (contest.problem_ids && contest.problem_ids.length > 0) {
      try {
        problems = await Problem.find({
          _id: { $in: contest.problem_ids },
          'metadata.isPublished': true
        })
        .select('title slug difficulty tags metadata.acceptanceRate points')
        .lean();
      } catch (error) {
        console.error('Error fetching problems:', error);
        // Continue without problems
      }
    }
    
    // ✅ FIXED: Get leaderboard without User include
    const leaderboard = await ContestParticipant.findAll({
      where: { contest_id: id },
      order: [
        ['score', 'DESC'],
        ['total_time', 'ASC']
      ],
      limit: 10
    });
    
    const leaderboardData = leaderboard.map((p, index) => ({
      rank: index + 1,
      userId: p.user_id,
      username: 'User', // We can't get username without MongoDB lookup
      score: p.score,
      solved: p.problems_solved,
      totalTime: p.total_time
    }));
    
    res.json({
      success: true,
      data: {
        contest: {
          ...contest.toJSON(),
          participantCount,
          participantsCount: participantCount,
          problemsCount: problems.length,
          // Add frontend-friendly field names
          startTime: contest.start_time,
          endTime: contest.end_time,
          duration: contest.duration_minutes
        },
        problems,
        leaderboard: leaderboardData
      }
    });
  } catch (error) {
    console.error('Get contest error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch contest',
      error: error.message 
    });
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
      difficulty,
      start_time,
      end_time,
      duration_minutes,
      max_participants,
      registration_open,
      is_private,
      registration_password,
      banner_url,
      tags,
      rules,
      prizes,
      problem_ids
    } = req.body;
    
    // Validation
    if (!title || !start_time || !end_time) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title, start time, and end time are required' 
      });
    }
    
    // Check authentication (with fallback)
    const userId = req.user?.id || req.user?._id?.toString() || null;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }
    
    // Generate slug if not provided
    const contestSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Check if slug already exists
    const existingContest = await Contest.findOne({ where: { slug: contestSlug } });
    if (existingContest) {
      return res.status(400).json({ 
        success: false, 
        message: 'Contest with this slug already exists. Please choose a different title.' 
      });
    }
    
    // Validate start and end times
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    const now = new Date();
    
    if (startDate < now) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be in the future'
      });
    }
    
    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }
    
    const calculatedDuration = Math.round((endDate - startDate) / (1000 * 60));
    
    if (calculatedDuration < 30) {
      return res.status(400).json({
        success: false,
        message: 'Contest must be at least 30 minutes long'
      });
    }
    
    // Validate problem IDs if provided
    let validatedProblemIds = [];
    if (problem_ids && Array.isArray(problem_ids) && problem_ids.length > 0) {
      try {
        const problems = await Problem.find({
          _id: { $in: problem_ids },
          'metadata.isPublished': true
        }).select('_id');
        
        validatedProblemIds = problems.map(p => p._id.toString());
        
        if (validatedProblemIds.length !== problem_ids.length) {
          console.warn('Some problem IDs were invalid or unpublished');
        }
      } catch (error) {
        console.error('Error validating problems:', error);
        // Continue without problems
      }
    }
    
    // Create contest
    const contest = await Contest.create({
      title,
      slug: contestSlug,
      description,
      contest_type: contest_type || 'practice',
      difficulty: difficulty || 'medium',
      status: 'draft',
      start_time: startDate,
      end_time: endDate,
      duration_minutes: duration_minutes || calculatedDuration,
      max_participants,
      registration_open: registration_open !== false,
      is_private: is_private || false,
      registration_password: is_private ? registration_password : null,
      banner_url,
      tags: tags || [],
      rules,
      prizes: Array.isArray(prizes) ? prizes : [],
      problem_ids: validatedProblemIds,
      created_by: userId
    });
    
    res.status(201).json({
      success: true,
      data: {
        ...contest.toJSON(),
        problemsCount: validatedProblemIds.length,
        // Add frontend-friendly field names
        startTime: contest.start_time,
        endTime: contest.end_time,
        duration: contest.duration_minutes
      },
      message: 'Contest created successfully! You can now add problems to it.'
    });
  } catch (error) {
    console.error('Create contest error:', error);
    console.error('Stack trace:', error.stack);
    
    // Handle specific Sequelize errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'A contest with this information already exists'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create contest. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update contest
// @route   PUT /api/v1/contests/:id
export const updateContest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const contest = await Contest.findByPk(id);
    
    if (!contest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contest not found' 
      });
    }
    
    // Check if user is creator (or admin)
    const userId = req.user?.id || req.user?._id?.toString();
    if (contest.created_by !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this contest' 
      });
    }
    
    // Update contest
    await contest.update(req.body);
    
    res.json({
      success: true,
      data: {
        ...contest.toJSON(),
        problemsCount: contest.problem_ids ? contest.problem_ids.length : 0,
        // Add frontend-friendly field names
        startTime: contest.start_time,
        endTime: contest.end_time,
        duration: contest.duration_minutes
      },
      message: 'Contest updated successfully'
    });
  } catch (error) {
    console.error('Update contest error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update contest',
      error: error.message 
    });
  }
};

// @desc    Delete contest
// @route   DELETE /api/v1/contests/:id
export const deleteContest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const contest = await Contest.findByPk(id);
    
    if (!contest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contest not found' 
      });
    }
    
    // Check if user is creator (or admin)
    const userId = req.user?.id || req.user?._id?.toString();
    if (contest.created_by !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this contest' 
      });
    }
    
    await contest.destroy();
    
    res.json({
      success: true,
      message: 'Contest deleted successfully'
    });
  } catch (error) {
    console.error('Delete contest error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete contest',
      error: error.message 
    });
  }
};

// @desc    Add problems to contest
// @route   POST /api/v1/contests/:id/problems
export const addProblemsToContest = async (req, res) => {
  try {
    const { id } = req.params;
    const { problem_ids } = req.body;
    
    if (!Array.isArray(problem_ids) || problem_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of problem IDs'
      });
    }
    
    const contest = await Contest.findByPk(id);
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }
    
    // Check authorization
    const userId = req.user?.id || req.user?._id?.toString();
    if (contest.created_by !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this contest'
      });
    }
    
    // Validate problems exist in MongoDB
    const problems = await Problem.find({
      _id: { $in: problem_ids },
      'metadata.isPublished': true
    }).select('_id title');
    
    if (problems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid problems found'
      });
    }
    
    const validProblemIds = problems.map(p => p._id.toString());
    
    // Merge with existing problem IDs (avoid duplicates)
    const existingIds = contest.problem_ids || [];
    const newProblemIds = [...new Set([...existingIds, ...validProblemIds])];
    
    await contest.update({ problem_ids: newProblemIds });
    
    res.json({
      success: true,
      data: {
        contest: contest.toJSON(),
        addedProblems: problems,
        totalProblems: newProblemIds.length
      },
      message: `Added ${problems.length} problem(s) to contest`
    });
  } catch (error) {
    console.error('Add problems error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add problems',
      error: error.message
    });
  }
};

// @desc    Register for contest
// @route   POST /api/v1/contests/:id/register
export const registerForContest = async (req, res) => {
  const { id: contestId } = req.params;
  const userId = req.user?.id || req.user?._id?.toString();
  const { password } = req.body;

  try {
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const contest = await Contest.findByPk(contestId);
    
    if (!contest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contest not found' 
      });
    }

    // Check if contest has started
    if (new Date() > contest.start_time) {
      return res.status(400).json({ 
        success: false, 
        message: 'Contest has already started' 
      });
    }

    // Check registration status
    if (!contest.registration_open) {
      return res.status(400).json({ 
        success: false, 
        message: 'Registration is closed' 
      });
    }

    // Check private contest password
    if (contest.is_private) {
      if (!contest.registration_password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Contest password not configured' 
        });
      }
      
      if (!password) {
        return res.status(401).json({ 
          success: false, 
          message: 'Password required for private contest' 
        });
      }
      
      if (password !== contest.registration_password) {
        return res.status(401).json({ 
          success: false, 
          message: 'Incorrect password' 
        });
      }
      
      console.log('✅ Password validated for private contest:', contestId);
    }

    // Check if already registered
    const existing = await ContestParticipant.findOne({
      where: { contest_id: contestId, user_id: userId }
    });

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already registered for this contest' 
      });
    }

    // Check max participants limit
    if (contest.max_participants) {
      const participantCount = await ContestParticipant.count({
        where: { contest_id: contestId }
      });
      
      if (participantCount >= contest.max_participants) {
        return res.status(400).json({ 
          success: false, 
          message: 'Contest is full' 
        });
      }
    }

    // Register user
    await ContestParticipant.create({
      contest_id: contestId,
      user_id: userId,
      joined_at: new Date()
    });

    res.json({ 
      success: true, 
      message: 'Successfully registered for contest' 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed',
      error: error.message 
    });
  }
};

// @desc    Submit solution during contest
// @route   POST /api/v1/contests/:id/submit
export const submitContestSolution = async (req, res) => {
  const { id: contestId } = req.params;
  const userId = req.user?.id || req.user?._id?.toString();
  const { problemId, code, language } = req.body;

  try {
    const contest = await Contest.findByPk(contestId);
    const now = new Date();

    if (!contest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contest not found' 
      });
    }

    // Verify contest is live
    if (now < contest.start_time) {
      return res.status(400).json({ 
        success: false, 
        message: 'Contest has not started yet' 
      });
    }
    
    if (now > contest.end_time) {
      return res.status(400).json({ 
        success: false, 
        message: 'Contest has ended' 
      });
    }

    // Check if user is registered
    const participant = await ContestParticipant.findOne({
      where: { contest_id: contestId, user_id: userId }
    });

    if (!participant) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not registered for this contest' 
      });
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
    res.status(500).json({ 
      success: false, 
      message: 'Submission failed',
      error: error.message 
    });
  }
};

// @desc    Get live leaderboard
// @route   GET /api/v1/contests/:id/leaderboard
export const getContestLeaderboard = async (req, res) => {
  const { id: contestId } = req.params;

  try {
    // Check Redis cache first
    const cacheKey = `contest:${contestId}:leaderboard`;
    
    if (redis && redis.get) {
      try {
        const cached = await redis.get(cacheKey);
        
        if (cached) {
          return res.json({ 
            success: true, 
            data: JSON.parse(cached),
            cached: true 
          });
        }
      } catch (redisError) {
        console.warn('Redis error, continuing without cache:', redisError.message);
      }
    }

    // ✅ FIXED: Fetch from database without User include
    const participants = await ContestParticipant.findAll({
      where: { contest_id: contestId },
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
      username: 'User', // Can't get username without MongoDB lookup
      score: p.score,
      solved: p.problems_solved,
      problemsSolved: p.problems_solved,
      totalTime: p.total_time
    }));

    // Cache for 10 seconds
    if (redis && redis.setex) {
      try {
        await redis.setex(cacheKey, 10, JSON.stringify(leaderboard));
      } catch (redisError) {
        console.warn('Redis cache set failed:', redisError.message);
      }
    }

    res.json({ 
      success: true, 
      data: leaderboard,
      cached: false 
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch leaderboard',
      error: error.message 
    });
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
    problems_solved: problemsSolved,
    last_submission_at: new Date()
  }, {
    where: { contest_id: contestId, user_id: userId }
  });
}

function calculatePoints(problemId, timeFromStart, scoringType) {
  const basePoints = 100;
  
  if (scoringType === 'time') {
    // Time-based scoring: lose 1 point per minute
    return Math.max(basePoints - timeFromStart, 10);
  }
  
  // Standard scoring
  return basePoints;
}

export default {
  getContests,
  getContest,
  createContest,
  updateContest,
  deleteContest,
  addProblemsToContest,
  registerForContest,
  submitContestSolution,
  getContestLeaderboard
};