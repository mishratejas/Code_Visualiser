/**
 * submission.controller.js — HTTP route handlers for code submissions.
 *
 * M1 fix: this file used to be 1080 lines mixing three concerns — the judge
 * engine (sandboxing, compiling, running untrusted code), DB side-effect
 * helpers (user/problem stats updates), and Express route handling. Those
 * are now split into dedicated files with no HTTP knowledge of their own:
 *   - src/services/judgeEngine.service.js  → executeCode() + sandbox runners
 *   - src/services/submissionStats.service.js → updateUserStats/updateProblemStats
 * This file now only does what a controller should: parse the request,
 * call the right service, shape the response.
 */
import Submission from "../models/submission.models.js";
import Problem from "../models/problem.models.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import notificationService from "../services/notification.service.js";
import ApiError from "../utils/ApiError.js";
import { VERDICT } from "../constants.js";
import achievementService from "../services/achievement.service.js";
import judgeQueue from "../jobs/judge.queue.js";
import { executeCode } from "../services/judgeEngine.service.js";
import { updateUserStats, updateProblemStats } from "../services/submissionStats.service.js";

// @desc    Submit code for execution
// @route   POST /api/v1/submissions
// @access  Private
export const submitCode = asyncHandler(async (req, res) => {
  const { problemId, language, code } = req.body;
  const userId = req.user._id;

  if (!problemId || !language || !code) {
    throw ApiError.badRequest("Problem ID, language, and code are required");
  }

  if (code.trim().length === 0) {
    throw ApiError.badRequest("Code cannot be empty");
  }

  // Find problem
  const problem = await Problem.findOne({
    _id: problemId,
    "metadata.isPublished": true,
  });

  if (!problem) {
    throw ApiError.notFound("Problem not found or not published");
  }

  // Check if user already solved this problem
  const existingAccepted = await Submission.findOne({
    user: userId,
    problem: problemId,
    verdict: VERDICT.ACCEPTED,
  });

  const isResubmit = !!existingAccepted;

  // Create submission record
  const submission = new Submission({
    user: userId,
    problem: problemId,
    language,
    code,
    totalTestCases: problem.testCases?.length || 0,
    verdict: VERDICT.PENDING,
    executedAt: new Date(),
    ipAddress: req.ip || "127.0.0.1",
    userAgent: req.get("user-agent") || "Unknown",
  });

  await submission.save();

  // ── M6 fix ──────────────────────────────────────────────────────────────
  // This used to `await executeCode(...)` directly here, meaning every
  // submission held the HTTP request open for the full compile+run time, and
  // a burst of submissions (e.g. a contest going live) would try to spin up
  // that many Docker containers concurrently with no ceiling. `bull` was
  // already a dependency but never wired up — it's activated here: the job
  // is queued, this request returns immediately with verdict "pending", and
  // judge.worker.js (processing the same queue) does the actual judging and
  // the side effects (stats/achievements/notifications) that used to run
  // inline below.
  const jobPayload = {
    submissionId: submission._id.toString(),
    code,
    language,
    testCases: problem.testCases || [],
    timeLimit: problem.constraints?.timeLimit || 2000,
    memoryLimit: problem.constraints?.memoryLimit || 256,
    userId: userId.toString(),
    problemId: problemId.toString(),
    isResubmit,
    problemTitle: problem.title,
  };

  let queued = true;
  try {
    await judgeQueue.add(jobPayload);
  } catch (queueError) {
    // Redis/queue unreachable — don't strand the submission at PENDING
    // forever with nothing to ever pick it up. Fall back to the previous
    // inline behaviour so submissions still work (degraded, not broken).
    queued = false;
    console.error("⚠️ Judge queue unavailable, falling back to inline execution:", queueError.message);

    const executionResult = await executeCode(
      code, language, jobPayload.testCases, jobPayload.timeLimit, jobPayload.memoryLimit,
    );

    submission.verdict = executionResult.verdict;
    submission.runtime = executionResult.displayRuntime ?? executionResult.runtime;
    submission.testCasesPassed = executionResult.testCasesPassed;
    submission.executionResults = executionResult.executionResults;
    submission.errorMessage = executionResult.errorMessage;
    submission.executionTime = Date.now() - submission.createdAt;
    await submission.save();

    updateUserStats(userId, problem, executionResult.verdict, problemId, isResubmit)
      .catch(err => console.error("Error updating user stats:", err));
    achievementService.checkSubmissionAchievements(userId, {
      verdict: executionResult.verdict,
      executionTime: submission.executionTime,
    }).catch(err => console.error("Achievement check error:", err));
    updateProblemStats(problemId, executionResult.verdict)
      .catch(err => console.error("Error updating problem stats:", err));
    notificationService.notifySubmission(userId, {
      status: executionResult.verdict,
      problemTitle: problem.title,
      executionTime: executionResult.runtime || 0,
      testCasesPassed: executionResult.testCasesPassed || 0,
      totalTestCases: problem.testCases?.length || 0,
      submissionId: submission._id,
    }).catch(err => console.error("Notification error:", err));
  }

  const responseData = {
    submission: {
      _id: submission._id,
      verdict: submission.verdict,
      runtime: submission.runtime,
      testCasesPassed: submission.testCasesPassed,
      totalTestCases: submission.totalTestCases,
      language: submission.language,
      executedAt: submission.executedAt,
      isResubmit,
      isAccepted: submission.verdict === VERDICT.ACCEPTED,
      isQueued: queued,
    },
  };

  // Only include execution results in development
  if (process.env.NODE_ENV === "development") {
    responseData.executionResults = submission.executionResults;
  }

  res.status(queued ? 202 : 201).json(
    ApiResponse.created(
      responseData,
      queued
        ? "Submission queued for judging. Poll GET /submissions/:id for the result."
        : executionResult2Message(submission.verdict),
    ),
  );
});

// Small helper kept local to submitCode's inline-fallback branch above —
// mirrors the message the old synchronous path used to return.
function executionResult2Message(verdict) {
  return verdict === VERDICT.ACCEPTED
    ? "🎉 Problem solved successfully!"
    : "Code executed. Check results.";
}

// @desc    Run code without submission (sandbox)
// @route   POST /api/v1/submissions/run
// @access  Private
export const runCode = asyncHandler(async (req, res) => {
  const { language, code, input, problemId } = req.body;

  if (!language || !code) {
    throw ApiError.badRequest("Language and code are required");
  }

  let testCases = [];
  if (input) {
    testCases = [{
      input: input,
      expectedOutput: "",
      isHidden: false,
    }];
  } else if (problemId) {
    const problem = await Problem.findById(problemId).select('testCases');
    if (problem) {
      testCases = problem.testCases?.filter(tc => !tc.isHidden) || [];
    }
  }

  const executionResult = await executeCode(
    code,
    language,
    testCases,
    5000, // 5 second timeout for custom runs
    256,
  );

  res.status(200).json(
    ApiResponse.success({
      output: executionResult.executionResults?.[0]?.actualOutput || "",
      error: executionResult.errorMessage || executionResult.executionResults?.[0]?.error,
      runtime: executionResult.runtime,
      verdict: executionResult.verdict,
      testCasesPassed: executionResult.testCasesPassed,
      totalTestCases: executionResult.totalTestCases || testCases.length,
      isSuccess: executionResult.verdict === VERDICT.ACCEPTED,
    }, "Code executed successfully"),
  );
});

// @desc    Get user's submissions with filters
// @route   GET /api/v1/submissions
// @access  Private
export const getUserSubmissions = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    problemId,
    verdict,
    language,
    startDate,
    endDate,
    sortBy = "-createdAt",
  } = req.query;

  const filter = { user: req.user._id };

  if (problemId) filter.problem = problemId;
  if (verdict) filter.verdict = verdict;
  if (language) filter.language = language;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = Math.min(parseInt(limit), 100);

  let sort = {};
  if (sortBy.startsWith("-")) {
    sort[sortBy.substring(1)] = -1;
  } else {
    sort[sortBy] = 1;
  }

  const [submissions, total] = await Promise.all([
    Submission.find(filter)
      .populate("problem", "title slug difficulty")
      .select("-code -executionResults")
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Submission.countDocuments(filter),
  ]);

  // Get stats
  const stats = await Submission.aggregate([
    { $match: { user: req.user._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        accepted: {
          $sum: { $cond: [{ $eq: ["$verdict", VERDICT.ACCEPTED] }, 1, 0] },
        },
        avgRuntime: {
          $avg: {
            $cond: [{ $eq: ["$verdict", VERDICT.ACCEPTED] }, "$runtime", null],
          },
        },
      },
    },
  ]);

  res.status(200).json(
    ApiResponse.success({
      submissions,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      stats: stats[0] || { total: 0, accepted: 0, avgRuntime: 0 },
    }, "Submissions fetched successfully"),
  );
});

// @desc    Get user's solved submissions
// @route   GET /api/v1/submissions/user/solved
// @access  Private
export const getUserSolvedSubmissions = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const allSubmissions = await Submission.find({
    user: userId,
  })
    .select("problem verdict")
    .lean();

  const attemptedProblems = new Set();
  const solvedProblems = new Set();

  for (const sub of allSubmissions) {
    const problemId = sub.problem.toString();
    if (sub.verdict === VERDICT.ACCEPTED) {
      solvedProblems.add(problemId);
    } else {
      if (!solvedProblems.has(problemId)) {
        attemptedProblems.add(problemId);
      }
    }
  }

  // Remove solved from attempted
  solvedProblems.forEach(id => attemptedProblems.delete(id));

  res.status(200).json(
    ApiResponse.success({
      solvedProblems: Array.from(solvedProblems),
      attemptedProblems: Array.from(attemptedProblems),
      totalSolved: solvedProblems.size,
      totalAttempted: attemptedProblems.size,
    }, "Solved problems fetched successfully"),
  );
});

// @desc    Get recent submissions for dashboard
// @route   GET /api/v1/submissions/recent
// @access  Private
export const getRecentSubmissions = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const submissions = await Submission.find({ user: req.user._id })
    .populate("problem", "title slug difficulty")
    .select("verdict runtime language createdAt")
    .sort({ createdAt: -1 })
    .limit(Math.min(parseInt(limit), 50))
    .lean();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySubmissions = await Submission.countDocuments({
    user: req.user._id,
    createdAt: { $gte: today },
  });

  res.status(200).json(
    ApiResponse.success({
      submissions,
      stats: {
        todaySubmissions,
        totalSubmissions: submissions.length,
      },
    }, "Recent submissions fetched"),
  );
});

// @desc    Get single submission with details
// @route   GET /api/v1/submissions/:id
// @access  Private
export const getSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const submission = await Submission.findOne({
    _id: id,
    user: req.user._id,
  })
    .populate("problem", "title slug difficulty tags constraints")
    .populate("user", "username")
    .lean();

  if (!submission) {
    throw ApiError.notFound("Submission not found");
  }

  res.status(200).json(
    ApiResponse.success({ submission }, "Submission fetched successfully"),
  );
});

// @desc    Get submissions for a specific problem
// @route   GET /api/v1/submissions/problem/:problemId
// @access  Private
export const getProblemSubmissions = asyncHandler(async (req, res) => {
  const { problemId } = req.params;
  const { page = 1, limit = 20, verdict } = req.query;

  const problem = await Problem.findById(problemId).select("title difficulty");
  if (!problem) {
    throw ApiError.notFound("Problem not found");
  }

  const filter = {
    user: req.user._id,
    problem: problemId,
  };

  if (verdict) filter.verdict = verdict;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = Math.min(parseInt(limit), 50);

  const [submissions, total] = await Promise.all([
    Submission.find(filter)
      .select("verdict runtime language testCasesPassed totalTestCases createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Submission.countDocuments(filter),
  ]);

  const bestSubmission = await Submission.findOne({
    user: req.user._id,
    problem: problemId,
    verdict: VERDICT.ACCEPTED,
  })
    .sort("runtime")
    .select("runtime memory createdAt")
    .lean();

  res.status(200).json(
    ApiResponse.success({
      problem: {
        title: problem.title,
        difficulty: problem.difficulty,
      },
      submissions,
      bestSubmission,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    }, "Problem submissions fetched successfully"),
  );
});

export default {
  submitCode,
  getUserSubmissions,
  getSubmission,
  getProblemSubmissions,
  getRecentSubmissions,
  runCode,
  getUserSolvedSubmissions,
};