import Contest from "../models/postgres/Contest.models.js";
import ContestParticipant from "../models/postgres/ContestParticipant.models.js";
import ContestSubmission from "../models/postgres/ContestSubmission.models.js";
import Problem from "../models/problem.models.js"; // MongoDB Problem model
import { Op } from "sequelize";
import redis from "../config/redis.config.js";
import User from "../models/user.models.js";

// @desc    Get all contests
// @route   GET /api/v1/contests
export const getContests = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 100 } = req.query;

    const where = {};

    // Filter by status
    if (status) {
      const now = new Date();

      if (status === "upcoming") {
        where.start_time = { [Op.gt]: now };
      } else if (status === "ongoing") {
        where.start_time = { [Op.lte]: now };
        where.end_time = { [Op.gte]: now };
      } else if (status === "past") {
        where.end_time = { [Op.lt]: now };
      }
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
      order: [["start_time", "DESC"]],
      attributes: { exclude: ["registration_password"] },
    });

    // Get participant counts, problem counts, and registration status for each contest
    const userId = req.user?.id || req.user?._id?.toString();

    const contestsWithCounts = await Promise.all(
      contests.rows.map(async (contest) => {
        const participantCount = await ContestParticipant.count({
          where: { contest_id: contest.id },
        });

        // ✅ Check if current user is registered
        let isRegistered = false;
        if (userId) {
          const participant = await ContestParticipant.findOne({
            where: {
              contest_id: contest.id,
              user_id: userId,
            },
          });
          isRegistered = !!participant;
        }

        return {
          ...contest.toJSON(),
          participantsCount: participantCount,
          problemsCount: contest.problem_ids ? contest.problem_ids.length : 0,
          isRegistered, // ✅ NEW: Registration status
          // Add frontend-friendly field names
          startTime: contest.start_time,
          endTime: contest.end_time,
          duration: contest.duration_minutes,
        };
      }),
    );

    res.json({
      success: true,
      data: contestsWithCounts,
      pagination: {
        total: contests.count,
        page: parseInt(page),
        pages: Math.ceil(contests.count / limit),
      },
    });
  } catch (error) {
    console.error("Get contests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contests",
      error: error.message,
    });
  }
};

// @desc    Get single contest with problems
// @route   GET /api/v1/contests/:id
export const getContest = async (req, res) => {
  try {
    const { id } = req.params;

    const contest = await Contest.findByPk(id, {
      attributes: { exclude: ["registration_password"] },
    });

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    // Get participant count
    const participantCount = await ContestParticipant.count({
      where: { contest_id: id },
    });

    // ✅ Check if current user is registered
    // ✅ NEW CODE (with better logging and type handling):
// ✅ IMPROVED: Check if current user is registered
let isRegistered = false;
const userId = req.user?.id || req.user?._id?.toString();

if (userId) {
  console.log('🔍 Checking registration for user:', {
    contestId: id,
    contestIdType: typeof id,
    userId: userId,
    userIdType: typeof userId
  });

  try {
    // ✅ FIX: Convert contest ID to number and user ID to string
    const contestIdNum = typeof id === 'string' ? parseInt(id, 10) : id;
    const userIdStr = userId.toString();
    
    console.log('🔍 Querying with:', { contest_id: contestIdNum, user_id: userIdStr });
    
    const participant = await ContestParticipant.findOne({
      where: {
        contest_id: contestIdNum,  // ← INTEGER
        user_id: userIdStr,         // ← STRING
      },
    });

    isRegistered = !!participant;

    console.log('✅ Registration check result:', {
      found: !!participant,
      isRegistered,
      participantId: participant?.id
    });

    if (participant) {
      console.log('📋 Participant details:', {
        id: participant.id,
        contest_id: participant.contest_id,
        user_id: participant.user_id,
        score: participant.score,
        joined_at: participant.joined_at
      });
    } else {
      console.warn('⚠️ No participant record found for:', { contestIdNum, userIdStr });
    }
  } catch (checkError) {
    console.error('❌ Registration check error:', checkError);
  }
}

    // Fetch actual problems from MongoDB
    let problems = [];
    if (contest.problem_ids && contest.problem_ids.length > 0) {
      try {
        problems = await Problem.find({
          _id: { $in: contest.problem_ids },
          "metadata.isPublished": true,
        })
          .select("title slug difficulty tags metadata.acceptanceRate points")
          .lean();
      } catch (error) {
        console.error("Error fetching problems:", error);
      }
    }

    // Get leaderboard
    const leaderboard = await ContestParticipant.findAll({
      where: { contest_id: id },
      order: [
        ["score", "DESC"],
        ["total_time", "ASC"],
      ],
      limit: 10,
    });

    const leaderboardData = leaderboard.map((p, index) => ({
      rank: index + 1,
      userId: p.user_id,
      username: "User",
      score: p.score,
      solved: p.problems_solved,
      totalTime: p.total_time,
    }));

    res.json({
      success: true,
      data: {
        ...contest.toJSON(),
        participantCount,
        participantsCount: participantCount,
        problemsCount: problems.length,
        problems,
        leaderboard: leaderboardData,
        isRegistered, // ✅ NEW: Registration status
        // Add frontend-friendly field names
        startTime: contest.start_time,
        endTime: contest.end_time,
        duration: contest.duration_minutes,
      },
    });
  } catch (error) {
    console.error("Get contest error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contest",
      error: error.message,
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
      problem_ids,
    } = req.body;

    // ✅ IMPROVED: Better validation with specific error messages
    const validationErrors = [];

    if (!title || title.trim().length === 0) {
      validationErrors.push("Title is required");
    }

    if (!start_time) {
      validationErrors.push("Start time is required");
    }

    if (!end_time) {
      validationErrors.push("End time is required");
    }

    // If there are basic validation errors, return early
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Check authentication
    const userId = req.user?.id || req.user?._id?.toString() || null;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    // Generate slug if not provided
    const contestSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Check if slug already exists
    const existingContest = await Contest.findOne({
      where: { slug: contestSlug },
    });
    if (existingContest) {
      return res.status(400).json({
        success: false,
        message:
          "Contest with this slug already exists. Please choose a different title.",
        errors: ["Duplicate contest title/slug"],
      });
    }

    // ✅ IMPROVED: Validate dates with better error messages
    let startDate, endDate;

    try {
      startDate = new Date(start_time);
      endDate = new Date(end_time);

      // Check if dates are valid
      if (isNaN(startDate.getTime())) {
        validationErrors.push("Invalid start time format");
      }
      if (isNaN(endDate.getTime())) {
        validationErrors.push("Invalid end time format");
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format",
          errors: validationErrors,
        });
      }
    } catch (dateError) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format provided",
        errors: ["Date parsing error: " + dateError.message],
      });
    }

    const now = new Date();

    // ✅ IMPROVED: Allow past dates for testing (remove in production)
    // Comment out this check during development
    /*
    if (startDate < now) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be in the future',
        errors: ['Start time is in the past']
      });
    }
    */

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
        errors: ["End time is before or equal to start time"],
      });
    }

    const calculatedDuration = Math.round((endDate - startDate) / (1000 * 60));

    if (calculatedDuration < 30) {
      return res.status(400).json({
        success: false,
        message: "Contest must be at least 30 minutes long",
        errors: [`Contest duration is only ${calculatedDuration} minutes`],
      });
    }

    // Validate problem IDs if provided
    let validatedProblemIds = [];
    let addedProblemsCount = 0;

    if (problem_ids && Array.isArray(problem_ids) && problem_ids.length > 0) {
      try {
        // Verify all problem IDs exist in MongoDB
        const problems = await Problem.find({ _id: { $in: problem_ids } });

        if (problems.length !== problem_ids.length) {
          const foundIds = problems.map((p) => p._id.toString());
          const notFoundIds = problem_ids.filter(
            (id) => !foundIds.includes(id.toString()),
          );

          return res.status(400).json({
            success: false,
            message: "Some problem IDs were not found",
            errors: [`Invalid problem IDs: ${notFoundIds.join(", ")}`],
            notFoundIds,
          });
        }

        validatedProblemIds = problem_ids;
        addedProblemsCount = validatedProblemIds.length;
      } catch (error) {
        console.error("Problem validation error:", error);
        return res.status(400).json({
          success: false,
          message: "Error validating problem IDs",
          errors: [error.message],
        });
      }
    }

    // Create contest
    const contest = await Contest.create({
      title: title.trim(),
      slug: contestSlug,
      description: description?.trim() || "",
      contest_type: contest_type || "practice",
      difficulty: difficulty || "medium",
      start_time: startDate,
      end_time: endDate,
      duration_minutes: duration_minutes || calculatedDuration,
      max_participants: max_participants ? parseInt(max_participants) : null,
      registration_open: registration_open !== false, // Default to true
      is_private: is_private || false,
      registration_password: is_private ? registration_password : null,
      banner_url: banner_url || null,
      tags: tags || [],
      rules: rules || null,
      prizes: prizes || [],
      problem_ids: validatedProblemIds,
      created_by: userId,
      creator_id: userId,
    });

    // ✅ Log for debugging
    console.log("✅ Contest created:", {
      id: contest.id,
      title: contest.title,
      problems: addedProblemsCount,
    });

    res.status(201).json({
      success: true,
      message:
        addedProblemsCount > 0
          ? `Contest created successfully with ${addedProblemsCount} problem(s)`
          : "Contest created successfully",
      data: {
        ...contest.toJSON(),
        problemsCount: addedProblemsCount,
        // Add frontend-friendly field names
        startTime: contest.start_time,
        endTime: contest.end_time,
        duration: contest.duration_minutes,
      },
    });
  } catch (error) {
    console.error("❌ Create contest error:", error);

    // Handle Sequelize validation errors
    if (error.name === "SequelizeValidationError") {
      const errors = error.errors.map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create contest",
      error: error.message,
      errors: [error.message],
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
        message: "Contest not found",
      });
    }

    // Check if user is creator (or admin)
    const userId = req.user?.id || req.user?._id?.toString();
    if (contest.created_by !== userId && req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this contest",
      });
    }

    // Update contest
    await contest.update(req.body);

    res.json({
      success: true,
      data: {
        ...contest.toJSON(),
        problemsCount: contest.problem_ids ? contest.problem_ids.length : 0,
        startTime: contest.start_time,
        endTime: contest.end_time,
        duration: contest.duration_minutes,
      },
      message: "Contest updated successfully",
    });
  } catch (error) {
    console.error("Update contest error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update contest",
      error: error.message,
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
        message: "Contest not found",
      });
    }

    // Check if user is creator (or admin)
    const userId = req.user?.id || req.user?._id?.toString();
    if (contest.created_by !== userId && req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this contest",
      });
    }

    await contest.destroy();

    res.json({
      success: true,
      message: "Contest deleted successfully",
    });
  } catch (error) {
    console.error("Delete contest error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete contest",
      error: error.message,
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
        message: "Please provide an array of problem IDs",
      });
    }

    const contest = await Contest.findByPk(id);

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    // Check authorization
    const userId = req.user?.id || req.user?._id?.toString();
    if (contest.created_by !== userId && req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this contest",
      });
    }

    // Validate problems exist in MongoDB
    const problems = await Problem.find({
      _id: { $in: problem_ids },
      "metadata.isPublished": true,
    }).select("_id title");

    if (problems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid problems found",
      });
    }

    const validProblemIds = problems.map((p) => p._id.toString());

    // Merge with existing problem IDs (avoid duplicates)
    const existingIds = contest.problem_ids || [];
    const newProblemIds = [...new Set([...existingIds, ...validProblemIds])];

    await contest.update({ problem_ids: newProblemIds });

    res.json({
      success: true,
      data: {
        contest: contest.toJSON(),
        addedProblems: problems,
        totalProblems: newProblemIds.length,
      },
      message: `Added ${problems.length} problem(s) to contest`,
    });
  } catch (error) {
    console.error("Add problems error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add problems",
      error: error.message,
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
        message: "Authentication required",
      });
    }

    // ✅ ADD: Log what we're trying to save
    console.log("📝 Registration attempt:", {
      contestId,
      contestIdType: typeof contestId,
      userId,
      userIdType: typeof userId,
      hasPassword: !!password,
    });

    const contest = await Contest.findByPk(contestId);

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    // ✅ FIX: Allow registration during contest (with warning)
    const now = new Date();
    const contestStarted = now > contest.start_time;
    const contestEnded = now > contest.end_time;

    // Only block if contest has ENDED
    if (contestEnded) {
      return res.status(400).json({
        success: false,
        message: "Contest has ended. Registration is closed.",
      });
    }

    // ✅ IMPROVED: Log for debugging
    console.log("📝 Registration request:", {
      contestId,
      userId,
      contestStarted,
      contestEnded,
      registrationOpen: contest.registration_open,
    });

    // Check registration status
    if (!contest.registration_open) {
      return res.status(400).json({
        success: false,
        message: "Registration is closed by admin",
      });
    }

    // Check private contest password
    if (contest.is_private) {
      if (!contest.registration_password) {
        return res.status(400).json({
          success: false,
          message: "Contest password not configured",
        });
      }

      if (!password) {
        return res.status(401).json({
          success: false,
          message: "Password required for private contest",
        });
      }

      if (password !== contest.registration_password) {
        return res.status(401).json({
          success: false,
          message: "Incorrect password",
        });
      }

      console.log("✅ Password validated for private contest:", contestId);
    }

    // Check if already registered
    const existing = await ContestParticipant.findOne({
      where: {
        contest_id: parseInt(contestId, 10), // ✅ Convert to number
        user_id: userId.toString(), // ✅ Ensure string
      },
    });

    if (existing) {
      console.log("⚠️ Already registered:", existing.toJSON());
      return res.status(400).json({
        success: false,
        message: "Already registered for this contest",
      });
    }

    // ✅ ADD: Convert types before saving
    const contestIdNum = parseInt(contestId, 10);
    const userIdStr = userId.toString();

    // Register user
    const participant = await ContestParticipant.create({
      contest_id: contestIdNum, // ✅ Save as number
      user_id: userIdStr, // ✅ Save as string
      joined_at: new Date(),
      score: 0,
      problems_solved: 0,
      total_time: 0,
    });

    console.log("✅ Participant created:", {
      id: participant.id,
      contest_id: participant.contest_id,
      user_id: participant.user_id,
      contestIdType: typeof participant.contest_id,
      userIdType: typeof participant.user_id,
    });

    // ✅ ADD: Verify it was saved
    const verify = await ContestParticipant.findOne({
      where: {
        contest_id: contestIdNum,
        user_id: userIdStr,
      },
    });

    if (!verify) {
      console.error(
        "❌ CRITICAL: Participant created but not found in database!",
      );
      throw new Error("Registration verification failed");
    }

    console.log("✅ Registration verified:", verify.toJSON());

    res.json({
      success: true,
      message: contestStarted
        ? "Successfully registered! Contest already started - good luck!"
        : "Successfully registered for contest",
      lateRegistration: contestStarted,
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
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
        message: "Contest not found",
      });
    }

    // Verify contest is live
    if (now < contest.start_time) {
      return res.status(400).json({
        success: false,
        message: "Contest has not started yet",
      });
    }

    if (now > contest.end_time) {
      return res.status(400).json({
        success: false,
        message: "Contest has ended",
      });
    }

    // Check if user is registered
    const participant = await ContestParticipant.findOne({
      where: { contest_id: contestId, user_id: userId },
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: "Not registered for this contest",
      });
    }

    // TODO: Execute code (integrate with your code execution service)
    // const submissionResult = await executeCode(code, language, problemId);

    const submissionResult = {
  submissionId: `sub_${Date.now()}`,
  verdict: "accepted",  // ✅ CORRECT - lowercase
  runtime: 100,
  memory: 2048,
};

    // Calculate time from contest start
    const timeFromStart = Math.floor((now - contest.start_time) / 60000); // minutes

    // Calculate points
    let pointsEarned = 0;
    if (submissionResult.verdict === "accepted") {
      pointsEarned = calculatePoints(
        problemId,
        timeFromStart,
        contest.contest_type,
      );
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
      submitted_at: now,
    });

    // Update participant score
    await updateParticipantScore(contestId, userId);

    res.json({
      success: true,
      data: {
        submission: contestSub,
        verdict: submissionResult.verdict,
        pointsEarned,
      },
    });
  } catch (error) {
    console.error("Contest submission error:", error);
    res.status(500).json({
      success: false,
      message: "Submission failed",
      error: error.message,
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
            cached: true,
          });
        }
      } catch (redisError) {
        console.warn(
          "Redis error, continuing without cache:",
          redisError.message,
        );
      }
    }

    // Fetch from database
    const participants = await ContestParticipant.findAll({
      where: { contest_id: contestId },
      order: [
        ["score", "DESC"],
        ["total_time", "ASC"],
        ["joined_at", "ASC"],
      ],
    });

    // ✅ FIX: Fetch usernames from MongoDB
    const leaderboard = await Promise.all(
      participants.map(async (p, index) => {
        let username = "User";

        // Try to get username from MongoDB User model
        try {
          const user = await User.findById(p.user_id);
          if (user) {
            username = user.username || user.email || "User";
          }
        } catch (err) {
          console.warn(
            `Could not fetch username for user ${p.user_id}:`,
            err.message,
          );
        }

        return {
          rank: index + 1,
          userId: p.user_id,
          username,
          score: p.score || 0,
          solved: p.problems_solved || 0,
          problemsSolved: p.problems_solved || 0,
          totalTime: p.total_time || 0,
          joinedAt: p.joined_at,
        };
      }),
    );

    // Cache for 10 seconds
    if (redis && redis.setex) {
      try {
        await redis.setex(cacheKey, 10, JSON.stringify(leaderboard));
      } catch (redisError) {
        console.warn("Redis cache set failed:", redisError.message);
      }
    }

    res.json({
      success: true,
      data: leaderboard,
      cached: false,
    });
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard",
      error: error.message,
    });
  }
};

// Helper functions
async function updateParticipantScore(contestId, userId) {
  const submissions = await ContestSubmission.findAll({
    where: {
      contest_id: contestId,
      user_id: userId,
      status: "accepted",
    },
  });

  const totalScore = submissions.reduce((sum, sub) => sum + sub.score, 0);
  const problemsSolved = new Set(submissions.map((s) => s.problem_id)).size;

  await ContestParticipant.update(
    {
      score: totalScore,
      problems_solved: problemsSolved,
      last_submission_at: new Date(),
    },
    {
      where: { contest_id: contestId, user_id: userId },
    },
  );
}

function calculatePoints(problemId, timeFromStart, scoringType) {
  const basePoints = 100;

  if (scoringType === "time") {
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
  getContestLeaderboard,
};
