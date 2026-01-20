import Submission from '../models/submission.models.js';
import Problem from '../models/problem.models.js';
import User from '../models/user.models.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { VERDICT } from '../constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

// Simple code executor (Will be replaced with Docker)
const executeCode = async (code, language, testCases, timeLimit, memoryLimit) => {
  const results = [];
  let totalRuntime = 0;
  let testCasesPassed = 0;
  
  // Create temp directory
  const tempDir = path.join(__dirname, '../../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const timestamp = Date.now();
  const fileName = `solution_${timestamp}`;
  
  try {
    // Write code to file
    let filePath, compileCommand, runCommand;
    
    switch(language) {
      case 'python':
        filePath = path.join(tempDir, `${fileName}.py`);
        fs.writeFileSync(filePath, code);
        runCommand = `python3 ${filePath}`;
        break;
        
      case 'javascript':
        filePath = path.join(tempDir, `${fileName}.js`);
        fs.writeFileSync(filePath, code);
        runCommand = `node ${filePath}`;
        break;
        
      case 'cpp':
        filePath = path.join(tempDir, `${fileName}.cpp`);
        fs.writeFileSync(filePath, code);
        const executablePath = path.join(tempDir, fileName);
        compileCommand = `g++ -std=c++17 ${filePath} -o ${executablePath}`;
        runCommand = executablePath;
        break;
        
      case 'java':
        filePath = path.join(tempDir, `${fileName}.java`);
        const className = code.match(/class\s+(\w+)/)?.[1] || 'Solution';
        fs.writeFileSync(filePath, code);
        compileCommand = `javac ${filePath}`;
        runCommand = `java -cp ${tempDir} ${className}`;
        break;
        
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
    
    // Compile if needed
    if (compileCommand) {
      try {
        await execAsync(compileCommand, { timeout: 10000 });
      } catch (compileError) {
        return {
          verdict: VERDICT.COMPILATION_ERROR,
          runtime: 0,
          testCasesPassed: 0,
          errorMessage: compileError.stderr || 'Compilation failed',
          executionResults: testCases.map((tc, index) => ({
            testCaseIndex: index,
            passed: false,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            actualOutput: '',
            error: 'Compilation Error'
          }))
        };
      }
    }
    
    // Execute each test case
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const startTime = Date.now();
      
      try {
        const { stdout, stderr } = await execAsync(runCommand, {
          timeout: timeLimit,
          input: testCase.input
        });
        
        const runtime = Date.now() - startTime;
        totalRuntime += runtime;
        
        // Clean output
        const actualOutput = stdout.trim();
        const expectedOutput = testCase.expectedOutput.trim();
        
        const passed = actualOutput === expectedOutput;
        if (passed) testCasesPassed++;
        
        results.push({
          testCaseIndex: i,
          passed,
          input: testCase.input,
          expectedOutput: expectedOutput,
          actualOutput: actualOutput,
          runtime,
          error: stderr || null
        });
        
        // Check for time limit
        if (runtime > timeLimit) {
          return {
            verdict: VERDICT.TIME_LIMIT_EXCEEDED,
            runtime: totalRuntime,
            testCasesPassed,
            errorMessage: `Time limit exceeded on test case ${i + 1}`,
            executionResults: results
          };
        }
        
      } catch (execError) {
        const runtime = Date.now() - startTime;
        
        if (execError.killed) {
          return {
            verdict: VERDICT.TIME_LIMIT_EXCEEDED,
            runtime: totalRuntime + runtime,
            testCasesPassed,
            errorMessage: 'Process killed due to timeout',
            executionResults: results
          };
        }
        
        results.push({
          testCaseIndex: i,
          passed: false,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          runtime,
          error: execError.stderr || 'Runtime Error'
        });
        
        return {
          verdict: VERDICT.RUNTIME_ERROR,
          runtime: totalRuntime + runtime,
          testCasesPassed,
          errorMessage: execError.stderr || 'Runtime Error',
          executionResults: results
        };
      }
    }
    
    // Cleanup temp files
    try {
      fs.unlinkSync(filePath);
      if (language === 'cpp') {
        const executablePath = path.join(tempDir, fileName);
        if (fs.existsSync(executablePath)) {
          fs.unlinkSync(executablePath);
        }
      }
      if (language === 'java') {
        const classFile = path.join(tempDir, `${fileName}.class`);
        if (fs.existsSync(classFile)) {
          fs.unlinkSync(classFile);
        }
      }
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
    
    // Determine verdict
    let verdict = VERDICT.WRONG_ANSWER;
    if (testCasesPassed === testCases.length) {
      verdict = VERDICT.ACCEPTED;
    }
    
    return {
      verdict,
      runtime: totalRuntime,
      testCasesPassed,
      totalTestCases: testCases.length,
      executionResults: results
    };
    
  } catch (error) {
    console.error('Execution error:', error);
    
    return {
      verdict: VERDICT.RUNTIME_ERROR,
      runtime: 0,
      testCasesPassed: 0,
      errorMessage: error.message,
      executionResults: testCases.map((tc, index) => ({
        testCaseIndex: index,
        passed: false,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: '',
        error: 'Execution failed'
      }))
    };
  }
};

// @desc    Submit code for execution
// @route   POST /api/v1/submissions
// @access  Private
export const submitCode = asyncHandler(async (req, res) => {
  const { problemId, language, code } = req.body;
  const userId = req.user._id;
  
  // Validate required fields
  if (!problemId || !language || !code) {
    throw ApiError.badRequest('Problem ID, language, and code are required');
  }
  
  // Check code length
  if (code.length > 10000) {
    throw ApiError.badRequest('Code exceeds maximum length of 10000 characters');
  }
  
  // Validate problem exists and is published
  const problem = await Problem.findOne({
    _id: problemId,
    'metadata.isPublished': true
  });
  
  if (!problem) {
    throw ApiError.notFound('Problem not found or not published');
  }
  
  // Check if user has already solved this problem
  const existingSubmission = await Submission.findOne({
    user: userId,
    problem: problemId,
    verdict: VERDICT.ACCEPTED
  });
  
  const isResubmit = !!existingSubmission;
  
  // Create submission record
  const submission = new Submission({
    user: userId,
    problem: problemId,
    language,
    code,
    totalTestCases: problem.testCases.length,
    executedAt: new Date(),
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });
  
  await submission.save();
  
  // Execute code
  const executionResult = await executeCode(
    code,
    language,
    problem.testCases,
    problem.constraints.timeLimit,
    problem.constraints.memoryLimit
  );
  
  // Update submission with execution results
  submission.verdict = executionResult.verdict;
  submission.runtime = executionResult.runtime;
  submission.testCasesPassed = executionResult.testCasesPassed;
  submission.executionResults = executionResult.executionResults;
  submission.errorMessage = executionResult.errorMessage;
  submission.executionTime = Date.now() - submission.createdAt;
  
  await submission.save();
  
  // Update user stats
  const updateUserStats = async () => {
    const user = await User.findById(userId);
    
    user.stats.totalSubmissions += 1;
    
    if (executionResult.verdict === VERDICT.ACCEPTED) {
      user.stats.acceptedSubmissions += 1;
      
      // Check if it's first time solving
      const previouslySolved = await Submission.findOne({
        user: userId,
        problem: problemId,
        verdict: VERDICT.ACCEPTED,
        _id: { $ne: submission._id }
      });
      
      if (!previouslySolved) {
        // First time solving this problem
        await user.addSolvedProblem(problemId, executionResult.runtime, 0);
        await user.markProblemAsSolved(problemId);
        user.stats.totalProblemsSolved += 1;
        
        // Update difficulty counts
        if (problem.difficulty === 'easy') {
          user.stats.easySolved += 1;
        } else if (problem.difficulty === 'medium') {
          user.stats.mediumSolved += 1;
        } else if (problem.difficulty === 'hard') {
          user.stats.hardSolved += 1;
        }
      }
    }
    
    // Update streak
    await user.updateStreak();
    await user.save();
  };
  
  // Update problem stats
  const updateProblemStats = async () => {
    problem.metadata.submissions += 1;
    
    if (executionResult.verdict === VERDICT.ACCEPTED) {
      // Recalculate acceptance rate
      await problem.updateAcceptanceRate();
      
      // Update average runtime for accepted submissions
      if (executionResult.runtime > 0) {
        await problem.updateAvgRuntime();
      }
    } else {
      await problem.save();
    }
    
    // Increment view count if first submission from this user
    const userSubmissionCount = await Submission.countDocuments({
      user: userId,
      problem: problemId
    });
    
    if (userSubmissionCount === 1) {
      problem.metadata.views += 1;
      await problem.save();
    }
  };
  
  // Run updates in parallel
  await Promise.all([updateUserStats(), updateProblemStats()]);
  
  // Prepare response
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
      isAccepted: submission.verdict === VERDICT.ACCEPTED
    }
  };
  
  // Include execution results for debugging in development
  if (process.env.NODE_ENV === 'development') {
    responseData.executionResults = submission.executionResults;
  }
  
  res.status(201).json(
    ApiResponse.created(
      responseData,
      executionResult.verdict === VERDICT.ACCEPTED 
        ? '🎉 Problem solved successfully!' 
        : 'Code executed. Check results.'
    )
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
    sortBy = '-createdAt'
  } = req.query;
  
  const filter = { user: req.user._id };
  
  if (problemId) filter.problem = problemId;
  if (verdict) filter.verdict = verdict;
  if (language) filter.language = language;
  
  // Date range filter
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = Math.min(parseInt(limit), 100);
  
  // Determine sort order
  let sort = {};
  if (sortBy.startsWith('-')) {
    sort[sortBy.substring(1)] = -1;
  } else {
    sort[sortBy] = 1;
  }
  
  const [submissions, total] = await Promise.all([
    Submission.find(filter)
      .populate('problem', 'title slug difficulty')
      .select('-code -executionResults -aiAnalysis')
      .sort(sort)
      .skip(skip)
      .limit(limitNum),
    Submission.countDocuments(filter)
  ]);
  
  // Get user stats for this filter
  const stats = await Submission.aggregate([
    { $match: filter },
    { $group: {
      _id: null,
      total: { $sum: 1 },
      accepted: { 
        $sum: { $cond: [{ $eq: ['$verdict', VERDICT.ACCEPTED] }, 1, 0] }
      },
      avgRuntime: { $avg: { $cond: [{ $eq: ['$verdict', VERDICT.ACCEPTED] }, '$runtime', null] } }
    }}
  ]);
  
  res.status(200).json(
    ApiResponse.paginated(
      {
        submissions,
        stats: stats[0] || { total: 0, accepted: 0, avgRuntime: 0 }
      },
      {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      'Submissions fetched successfully'
    )
  );
});

// @desc    Get single submission with details
// @route   GET /api/v1/submissions/:id
// @access  Private
export const getSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const submission = await Submission.findOne({
    _id: id,
    user: req.user._id
  })
    .populate('problem', 'title slug difficulty tags constraints')
    .populate('user', 'username profile.name');
  
  if (!submission) {
    throw ApiError.notFound('Submission not found');
  }
  
  // Only show code and detailed results to the submitter or admin
  const canViewDetails = 
    submission.user._id.toString() === req.user._id.toString() || 
    req.user.role === 'admin';
  
  if (!canViewDetails) {
    throw ApiError.forbidden('You can only view your own submissions');
  }
  
  res.status(200).json(
    ApiResponse.success(
      { submission },
      'Submission fetched successfully'
    )
  );
});

// @desc    Get submissions for a specific problem
// @route   GET /api/v1/submissions/problem/:problemId
// @access  Private
export const getProblemSubmissions = asyncHandler(async (req, res) => {
  const { problemId } = req.params;
  const { page = 1, limit = 20, verdict } = req.query;
  
  // Verify problem exists
  const problem = await Problem.findById(problemId);
  if (!problem) {
    throw ApiError.notFound('Problem not found');
  }
  
  const filter = {
    user: req.user._id,
    problem: problemId
  };
  
  if (verdict) filter.verdict = verdict;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = Math.min(parseInt(limit), 50);
  
  const [submissions, total] = await Promise.all([
    Submission.find(filter)
      .select('verdict runtime language testCasesPassed totalTestCases createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Submission.countDocuments(filter)
  ]);
  
  // Get best submission for this problem
  const bestSubmission = await Submission.findOne({
    user: req.user._id,
    problem: problemId,
    verdict: VERDICT.ACCEPTED
  }).sort('runtime').select('runtime memory createdAt');
  
  // Get problem stats
  const problemStats = await Submission.getProblemStats(problemId);
  
  res.status(200).json(
    ApiResponse.success({
      problem: {
        title: problem.title,
        difficulty: problem.difficulty
      },
      submissions,
      bestSubmission,
      problemStats,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }, 'Problem submissions fetched successfully')
  );
});

// @desc    Get user's solved problem IDs
// @route   GET /api/v1/submissions/user/solved
// @access  Private
export const getUserSolvedSubmissions = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get only accepted submissions for this user
    const solvedSubmissions = await Submission.find({
      user: userId,
      verdict: VERDICT.ACCEPTED
    }).select('problem -_id');
    
    // Extract unique problem IDs
    const solvedProblemIds = [...new Set(
      solvedSubmissions
        .map(s => s.problem ? s.problem.toString() : null)
        .filter(id => id !== null)
    )];
    
    res.status(200).json(
      ApiResponse.success({
        success: true,
        count: solvedProblemIds.length,
        data: solvedProblemIds
      }, 'Solved problems fetched successfully')
    );
  } catch (error) {
    console.error('Error fetching solved submissions:', error);
    throw ApiError.internal('Failed to fetch solved problems');
  }
});

// @desc    Get recent submissions for dashboard
// @route   GET /api/v1/submissions/recent
// @access  Private
export const getRecentSubmissions = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const submissions = await Submission.find({ user: req.user._id })
    .populate('problem', 'title slug difficulty')
    .select('verdict runtime language createdAt')
    .sort({ createdAt: -1 })
    .limit(Math.min(parseInt(limit), 50));
  
  // Get today's submission count
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaySubmissions = await Submission.countDocuments({
    user: req.user._id,
    createdAt: { $gte: today }
  });
  
  res.status(200).json(
    ApiResponse.success({
      submissions,
      stats: {
        todaySubmissions,
        totalSubmissions: submissions.length
      }
    }, 'Recent submissions fetched')
  );
});

// @desc    Run code without submission (sandbox)
// @route   POST /api/v1/submissions/run
// @access  Private
export const runCode = asyncHandler(async (req, res) => {
  const { language, code, input } = req.body;
  
  if (!language || !code) {
    throw ApiError.badRequest('Language and code are required');
  }
  
  const testCases = input ? [{
    input: input,
    expectedOutput: '',
    isHidden: false
  }] : [];
  
  const executionResult = await executeCode(
    code,
    language,
    testCases,
    5000, // 5 second timeout for sandbox
    256   // 256MB memory limit
  );
  
  res.status(200).json(
    ApiResponse.success({
      output: executionResult.executionResults[0]?.actualOutput || '',
      error: executionResult.errorMessage || executionResult.executionResults[0]?.error,
      runtime: executionResult.runtime,
      verdict: executionResult.verdict
    }, 'Code executed successfully')
  );
});