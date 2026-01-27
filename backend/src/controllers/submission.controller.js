import Submission from '../models/submission.models.js';
import Problem from '../models/problem.models.js'
import User from '../models/user.models.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { VERDICT } from '../constants.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

const executeCode = async (code, language, testCases, timeLimit, memoryLimit) => {
  const results = [];
  let totalRuntime = 0;
  let testCasesPassed = 0;
  
  // Create temp directory
  const tempDir = path.join(__dirname, '../../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const uniqueId = uuidv4().slice(0, 8);
  const fileName = `solution_${uniqueId}`;
  let filePath, compileCommand, executablePath, className;
  
  try {
    // Write code to file
    switch(language) {
      case 'python':
        filePath = path.join(tempDir, `${fileName}.py`);
        fs.writeFileSync(filePath, code);
        executablePath = 'python3';
        break;
        
      case 'javascript':
        filePath = path.join(tempDir, `${fileName}.js`);
        fs.writeFileSync(filePath, code);
        executablePath = 'node';
        break;
        
      case 'cpp':
        filePath = path.join(tempDir, `${fileName}.cpp`);
        fs.writeFileSync(filePath, code);
        executablePath = path.join(tempDir, fileName);
        compileCommand = `g++ -std=c++17 ${filePath} -o ${executablePath}`;
        break;
        
      case 'java':
        filePath = path.join(tempDir, `${fileName}.java`);
        className = code.match(/class\s+(\w+)/)?.[1] || 'Solution';
        fs.writeFileSync(filePath, code);
        compileCommand = `javac ${filePath}`;
        executablePath = 'java';
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
        // FIXED: Properly parse the input
        // The test case input is stored as "3\n0 1 3" with literal \n characters
        // We need to convert \n to actual newlines and ensure proper formatting
        let input = testCase.input;
        
        // Replace escaped newlines with actual newlines
        if (input.includes('\\n')) {
          input = input.replace(/\\n/g, '\n');
        }
        
        // Ensure input ends with newline (most programs expect this)
        if (!input.endsWith('\n')) {
          input += '\n';
        }
        
        // Debug logging
        console.log(`Test case ${i + 1} input (raw):`, JSON.stringify(testCase.input));
        console.log(`Test case ${i + 1} input (parsed):`, JSON.stringify(input));
        console.log(`Test case ${i + 1} input bytes:`, Buffer.from(input).toString('hex'));
        
        // Determine command and arguments
        let cmd, args;
        if (language === 'python') {
          cmd = 'python3';
          args = [filePath];
        } else if (language === 'javascript') {
          cmd = 'node';
          args = [filePath];
        } else if (language === 'cpp') {
          cmd = executablePath;
          args = [];
        } else if (language === 'java') {
          cmd = 'java';
          args = ['-cp', tempDir, className];
        }
        
        // Use spawn for better input/output handling
        const childProcess = spawn(cmd, args, {
          timeout: timeLimit,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        // Collect stdout
        childProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });
        
        // Collect stderr
        childProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        // Set up timeout
        let timeoutId = setTimeout(() => {
          childProcess.kill('SIGKILL');
        }, timeLimit);
        
        // Write input to stdin
        childProcess.stdin.write(input);
        childProcess.stdin.end();
        
        // Wait for process to complete
        const exitCode = await new Promise((resolve, reject) => {
          childProcess.on('close', (code) => {
            clearTimeout(timeoutId);
            resolve(code);
          });
          
          childProcess.on('error', (err) => {
            clearTimeout(timeoutId);
            reject(err);
          });
        });
        
        const runtime = Date.now() - startTime;
        totalRuntime += runtime;
        
        // Check if process was killed by timeout
        if (timeoutId._destroyed) {
          throw new Error('Time limit exceeded');
        }
        
        // Clean output - remove trailing whitespace
        const actualOutput = stdout.trim();
        const expectedOutput = testCase.expectedOutput.trim();
        
        // Debug output
        console.log(`Test case ${i + 1} output:`, JSON.stringify(actualOutput));
        console.log(`Test case ${i + 1} expected:`, JSON.stringify(expectedOutput));
        console.log(`Test case ${i + 1} stderr:`, JSON.stringify(stderr));
        
        const passed = actualOutput === expectedOutput;
        if (passed) testCasesPassed++;
        
        results.push({
          testCaseIndex: i,
          passed,
          input: testCase.input,
          expectedOutput: expectedOutput,
          actualOutput: actualOutput,
          runtime,
          memory: 0,
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
        const errorMessage = execError.message || 'Execution failed';
        
        console.error(`Execution error on test case ${i + 1}:`, errorMessage);
        
        results.push({
          testCaseIndex: i,
          passed: false,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          runtime,
          memory: 0,
          error: errorMessage
        });
        
        if (errorMessage.includes('Time limit exceeded') || runtime > timeLimit) {
          return {
            verdict: VERDICT.TIME_LIMIT_EXCEEDED,
            runtime: totalRuntime + runtime,
            testCasesPassed,
            errorMessage: 'Time limit exceeded',
            executionResults: results
          };
        }
        
        return {
          verdict: VERDICT.RUNTIME_ERROR,
          runtime: totalRuntime + runtime,
          testCasesPassed,
          errorMessage: errorMessage,
          executionResults: results
        };
      }
    }
    
    // Cleanup temp files
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      if (language === 'cpp' && fs.existsSync(executablePath)) {
        fs.unlinkSync(executablePath);
      }
      if (language === 'java') {
        const classFile = path.join(tempDir, `${fileName}.class`);
        if (fs.existsSync(classFile)) {
          fs.unlinkSync(classFile);
        }
        // Also clean up if class name is different
        const actualClassName = code.match(/class\s+(\w+)/)?.[1];
        if (actualClassName && actualClassName !== 'Solution') {
          const otherClassFile = path.join(tempDir, `${actualClassName}.class`);
          if (fs.existsSync(otherClassFile)) {
            fs.unlinkSync(otherClassFile);
          }
        }
      }
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
    
    // Determine verdict
    let verdict = VERDICT.WRONG_ANSWER;
    if (testCasesPassed === testCases.length) {
      verdict = VERDICT.ACCEPTED;
    } else if (testCasesPassed > 0) {
      verdict = VERDICT.PARTIAL_ACCEPTED;
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

const executeCodeSimple = async (code, language, testCases, timeLimit, memoryLimit) => {
  const tempDir = path.join(__dirname, '../../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const uniqueId = uuidv4().slice(0, 8);
  const fileName = `solution_${uniqueId}`;
  let filePath, executablePath;
  
  try {
    // Write code to file
    filePath = path.join(tempDir, `${fileName}.cpp`);
    fs.writeFileSync(filePath, code);
    
    // Compile C++
    executablePath = path.join(tempDir, fileName);
    const compileCmd = `g++ -std=c++17 "${filePath}" -o "${executablePath}"`;
    console.log(`Compiling: ${compileCmd}`);
    
    try {
      await execAsync(compileCmd, { timeout: 10000 });
      console.log('✅ Compiled successfully');
    } catch (compileError) {
      console.error('❌ Compilation failed:', compileError.stderr);
      return {
        verdict: VERDICT.COMPILATION_ERROR,
        runtime: 0,
        testCasesPassed: 0,
        errorMessage: compileError.stderr || 'Compilation failed'
      };
    }
    
    // Run test cases
    const results = [];
    let totalRuntime = 0;
    let testCasesPassed = 0;
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const startTime = Date.now();
      
      // Prepare input - CRITICAL FIX FOR WINDOWS
      let input = testCase.input;
      
      // Convert escaped newlines to actual newlines
      if (input.includes('\\n')) {
        input = input.replace(/\\n/g, '\n');
      }
      
      // For Windows, we need to be careful about line endings
      // Replace all \n with \r\n for Windows compatibility
      input = input.replace(/\n/g, '\r\n');
      
      console.log(`\n=== Test Case ${i + 1} ===`);
      console.log(`Input:`, JSON.stringify(input));
      console.log(`Input hex:`, Buffer.from(input).toString('hex'));
      
      try {
        // DEBUG: Try a simpler approach - write input to file and use file redirection
        const inputFile = path.join(tempDir, `input_${uniqueId}.txt`);
        fs.writeFileSync(inputFile, input);
        
        // Use file redirection instead of stdin piping
        const command = `"${executablePath}" < "${inputFile}"`;
        console.log(`Command: ${command}`);
        
        const { stdout, stderr } = await execAsync(command, {
          timeout: timeLimit,
          shell: true, // Need shell for redirection
          maxBuffer: 1024 * 1024,
          windowsHide: true // Important for Windows
        });
        
        const runtime = Date.now() - startTime;
        totalRuntime += runtime;
        
        console.log(`Stdout: "${stdout}"`);
        console.log(`Stderr: "${stderr}"`);
        console.log(`Runtime: ${runtime}ms`);
        
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
          memory: 0,
          error: stderr || null
        });
        
        // Clean up input file
        try {
          fs.unlinkSync(inputFile);
        } catch (e) {
          // Ignore
        }
        
        if (runtime > timeLimit) {
          return {
            verdict: VERDICT.TIME_LIMIT_EXCEEDED,
            runtime: totalRuntime,
            testCasesPassed,
            errorMessage: 'Time limit exceeded',
            executionResults: results
          };
        }
        
      } catch (execError) {
        const runtime = Date.now() - startTime;
        totalRuntime += runtime;
        
        console.error(`❌ Error:`, execError.message);
        console.error(`Signal:`, execError.signal);
        console.error(`Killed:`, execError.killed);
        
        if (execError.killed || execError.signal || runtime > timeLimit) {
          return {
            verdict: VERDICT.TIME_LIMIT_EXCEEDED,
            runtime: totalRuntime,
            testCasesPassed,
            errorMessage: 'Time limit exceeded',
            executionResults: results
          };
        }
        
        return {
          verdict: VERDICT.RUNTIME_ERROR,
          runtime: totalRuntime,
          testCasesPassed,
          errorMessage: execError.stderr || 'Runtime Error',
          executionResults: results
        };
      }
    }
    
    // Cleanup
    try {
      fs.unlinkSync(filePath);
      if (fs.existsSync(executablePath)) {
        fs.unlinkSync(executablePath);
      }
    } catch (e) {
      console.error('Cleanup error:', e);
    }
    
    const verdict = testCasesPassed === testCases.length ? VERDICT.ACCEPTED : VERDICT.WRONG_ANSWER;
    
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
      errorMessage: error.message
    };
  }
};

// Memory tracking function for Windows
const getMemoryUsage = async (pid) => {
  try {
    if (process.platform === 'win32') {
      // Windows command
      const cmd = `wmic process where processid=${pid} get WorkingSetSize /value`;
      const result = await execAsync(cmd);
      const match = result.stdout.match(/WorkingSetSize=(\d+)/);
      if (match) {
        return Math.round(parseInt(match[1]) / 1024 / 1024); // Convert to MB
      }
    }
    // For Linux/Mac, you can implement later
    return 0;
  } catch (error) {
    console.error('Memory check failed:', error);
    return 0;
  }
};

// @desc    Submit code for execution
// @route   POST /api/v1/submissions
// @access  Private
export const submitCode = asyncHandler(async (req, res) => {
  try {
    console.log('=== SUBMISSION START ===');
    console.log('User:', req.user._id);
    console.log('Body:', { 
      problemId: req.body.problemId, 
      language: req.body.language,
      codeLength: req.body.code?.length 
    });

    const { problemId, language, code } = req.body;
    const userId = req.user._id;
    
    if (!problemId || !language || !code) {
      console.log('Missing required fields');
      throw ApiError.badRequest('Problem ID, language, and code are required');
    }
    
    if (code.trim().length === 0) {
      throw ApiError.badRequest('Code cannot be empty');
    }

    console.log('Finding problem:', problemId);
    const problem = await Problem.findOne({
      _id: problemId,
      'metadata.isPublished': true
    });
    
    if (!problem) {
      console.log('Problem not found or not published');
      throw ApiError.notFound('Problem not found or not published');
    }
    
    console.log('Problem found:', problem.title);
    console.log('Test cases:', problem.testCases?.length);

    const existingSubmission = await Submission.findOne({
      user: userId,
      problem: problemId,
      verdict: VERDICT.ACCEPTED
    });
    
    const isResubmit = !!existingSubmission;
    console.log('Is resubmit:', isResubmit);

    console.log('Creating submission record...');
    const submission = new Submission({
      user: userId,
      problem: problemId,
      language,
      code,
      totalTestCases: problem.testCases?.length || 0,
      executedAt: new Date(),
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.get('user-agent') || 'Unknown'
    });

    await submission.save();
    console.log('✅ Submission created:', submission._id);

    console.log('Executing code...');
    console.log('Language:', language);
    console.log('Time limit:', problem.constraints?.timeLimit || 2000);
    
    // Use the simple version for debugging
    const executionResult = await executeCodeSimple(
      code,
      language,
      problem.testCases || [],
      problem.constraints?.timeLimit || 2000,
      problem.constraints?.memoryLimit || 256
    );
    
    console.log('Execution result:', {
      verdict: executionResult.verdict,
      runtime: executionResult.runtime,
      testCasesPassed: executionResult.testCasesPassed,
      totalTestCases: executionResult.totalTestCases
    });

    submission.verdict = executionResult.verdict;
    submission.runtime = executionResult.runtime;
    submission.testCasesPassed = executionResult.testCasesPassed;
    submission.executionResults = executionResult.executionResults;
    submission.errorMessage = executionResult.errorMessage;
    submission.executionTime = Date.now() - submission.createdAt;
    
    await submission.save();
    console.log('✅ Submission updated with results');

    // Update user stats
    console.log('Updating user stats...');
    try {
      const user = await User.findById(userId);
      if (user) {
        user.stats = user.stats || {};
        user.stats.totalSubmissions = (user.stats.totalSubmissions || 0) + 1;
        
        if (executionResult.verdict === VERDICT.ACCEPTED) {
          user.stats.acceptedSubmissions = (user.stats.acceptedSubmissions || 0) + 1;
          
          const previouslySolved = await Submission.findOne({
            user: userId,
            problem: problemId,
            verdict: VERDICT.ACCEPTED,
            _id: { $ne: submission._id }
          });
          
          if (!previouslySolved) {
            user.stats.totalProblemsSolved = (user.stats.totalProblemsSolved || 0) + 1;
            
            if (problem.difficulty === 'easy') {
              user.stats.easySolved = (user.stats.easySolved || 0) + 1;
            } else if (problem.difficulty === 'medium') {
              user.stats.mediumSolved = (user.stats.mediumSolved || 0) + 1;
            } else if (problem.difficulty === 'hard') {
              user.stats.hardSolved = (user.stats.hardSolved || 0) + 1;
            }
            
            if (!user.solvedProblems) user.solvedProblems = [];
            if (!user.solvedProblems.includes(problemId)) {
              user.solvedProblems.push(problemId);
            }
          }
        }
        
        if (!user.attemptedProblems) user.attemptedProblems = [];
        if (!user.attemptedProblems.includes(problemId)) {
          user.attemptedProblems.push(problemId);
        }
        
        await user.save();
        console.log('✅ User stats updated');
      }
    } catch (userError) {
      console.error('Error updating user stats:', userError);
    }

    // Update problem stats
    console.log('Updating problem stats...');
    try {
      problem.metadata = problem.metadata || {};
      problem.metadata.submissions = (problem.metadata.submissions || 0) + 1;
      
      if (executionResult.verdict === VERDICT.ACCEPTED) {
        problem.metadata.acceptedSubmissions = (problem.metadata.acceptedSubmissions || 0) + 1;
      }
      
      if (problem.metadata.submissions > 0) {
        problem.metadata.acceptanceRate = Math.round(
          (problem.metadata.acceptedSubmissions || 0) / problem.metadata.submissions * 100
        );
      }
      
      const userSubmissionCount = await Submission.countDocuments({
        user: userId,
        problem: problemId
      });
      
      if (userSubmissionCount === 1) {
        problem.metadata.views = (problem.metadata.views || 0) + 1;
      }
      
      await problem.save();
      console.log('✅ Problem stats updated');
    } catch (problemError) {
      console.error('Error updating problem stats:', problemError);
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
        isAccepted: submission.verdict === VERDICT.ACCEPTED
      }
    };
    
    if (process.env.NODE_ENV === 'development') {
      responseData.executionResults = submission.executionResults;
    }
    
    console.log('=== SUBMISSION COMPLETE ===');
    res.status(201).json(
      ApiResponse.created(
        responseData,
        executionResult.verdict === VERDICT.ACCEPTED 
          ? '🎉 Problem solved successfully!' 
          : 'Code executed. Check results.'
      )
    );
    
  } catch (error) {
    console.error('=== SUBMISSION ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw ApiError.internal('Failed to process submission: ' + error.message);
  }
});

// @desc    Get user's submissions with filters
// @route   GET /api/v1/submissions
// @access  Private
export const getUserSubmissions = asyncHandler(async (req, res) => {
  try {
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
    
    console.log('📊 Getting user submissions with filters:', { 
      page, limit, problemId, verdict, language, sortBy 
    });
    
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
    if (sortBy.startsWith('-')) {
      sort[sortBy.substring(1)] = -1;
    } else {
      sort[sortBy] = 1;
    }
    
    // FIX: Use lean() to get plain objects, not mongoose documents
    const submissions = await Submission.find(filter)
      .populate({
        path: 'problem',
        select: 'title slug difficulty',
        // FIX: Use transform to ensure problem is a plain object
        transform: (doc) => {
          if (!doc) return null;
          return {
            _id: doc._id,
            title: doc.title || 'Unknown Problem',
            slug: doc.slug || '',
            difficulty: doc.difficulty || 'medium'
          };
        }
      })
      .select('-code -executionResults -aiAnalysis')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(); // ADD THIS: Get plain objects instead of mongoose documents
    
    const total = await Submission.countDocuments(filter);
    
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
    
    console.log(`✅ Found ${submissions.length} submissions out of ${total} total`);
    
    res.status(200).json(
      ApiResponse.success(
        {
          submissions,
          pagination: {
            page: parseInt(page),
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
          },
          stats: stats[0] || { total: 0, accepted: 0, avgRuntime: 0 }
        },
        'Submissions fetched successfully'
      )
    );
  } catch (error) {
    console.error('❌ Error in getUserSubmissions:', error);
    console.error('Stack trace:', error.stack);
    throw ApiError.internal('Failed to fetch submissions: ' + error.message);
  }
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
  
  const bestSubmission = await Submission.findOne({
    user: req.user._id,
    problem: problemId,
    verdict: VERDICT.ACCEPTED
  }).sort('runtime').select('runtime memory createdAt');
  
  res.status(200).json(
    ApiResponse.success({
      problem: {
        title: problem.title,
        difficulty: problem.difficulty
      },
      submissions,
      bestSubmission,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }, 'Problem submissions fetched successfully')
  );
});

// @desc    Get user's solved submissions
// @route   GET /api/v1/submissions/user/solved
// @access  Private
export const getUserSolvedSubmissions = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  console.log('📊 Fetching solved problems for user:', userId);

  const allSubmissions = await Submission.find({
    user: userId
  }).select('problem verdict').lean();

  const attemptedProblems = new Set();
  const solvedProblems = new Set();

  allSubmissions.forEach(sub => {
    const problemId = sub.problem.toString();
    if (sub.verdict === 'accepted') {
      solvedProblems.add(problemId);
    } else {
      if (!solvedProblems.has(problemId)) {
        attemptedProblems.add(problemId);
      }
    }
  });

  // Remove solved from attempted
  solvedProblems.forEach(id => attemptedProblems.delete(id));

  const response = {
    solvedProblems: Array.from(solvedProblems),
    attemptedProblems: Array.from(attemptedProblems),
    totalSolved: solvedProblems.size,
    totalAttempted: attemptedProblems.size
  };

  console.log('✅ Solved:', response.totalSolved, 'Attempted:', response.totalAttempted);

  res.status(200).json(
    ApiResponse.success(response, 'Solved problems fetched successfully')
  );
});

// @desc    Get recent submissions for dashboard
// @route   GET /api/v1/submissions/recent
// @access  Private
export const getRecentSubmissions = asyncHandler(async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    console.log('📊 Getting recent submissions for user:', req.user?._id);
    
    if (!req.user?._id) {
      throw ApiError.unauthorized('User not authenticated');
    }
    
    const submissions = await Submission.find({ user: req.user._id })
      .populate('problem', 'title slug difficulty')
      .select('verdict runtime language createdAt codeSize')
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit), 50));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySubmissions = await Submission.countDocuments({
      user: req.user._id,
      createdAt: { $gte: today }
    });
    
    console.log(`✅ Found ${submissions.length} recent submissions`);
    
    res.status(200).json(
      ApiResponse.success({
        submissions,
        stats: {
          todaySubmissions,
          totalSubmissions: submissions.length
        }
      }, 'Recent submissions fetched')
    );
  } catch (error) {
    console.error('❌ Error in getRecentSubmissions:', error);
    throw ApiError.internal('Failed to fetch recent submissions: ' + error.message);
  }
});

// @desc    Run code without submission (sandbox)
// @route   POST /api/v1/submissions/run
// @access  Private
export const runCode = asyncHandler(async (req, res) => {
  try {
    const { language, code, input, problemId } = req.body;
    
    console.log('Run code request:', { 
      language, 
      codeLength: code?.length,
      inputLength: input?.length,
      problemId 
    });
    
    if (!language || !code) {
      throw ApiError.badRequest('Language and code are required');
    }
    
    let testCases = [];
    if (input) {
      testCases = [{
        input: input,
        expectedOutput: '',
        isHidden: false
      }];
    } else if (problemId) {
      const problem = await Problem.findById(problemId);
      if (problem) {
        testCases = problem.testCases || [];
      }
    }
    
    console.log(`Running ${testCases.length} test cases`);
    
    const executionResult = await executeCodeSimple(
      code,
      language,
      testCases,
      5000,
      256
    );
    
    console.log('Execution result:', {
      verdict: executionResult.verdict,
      runtime: executionResult.runtime,
      passed: executionResult.testCasesPassed
    });
    
    res.status(200).json(
      ApiResponse.success({
        output: executionResult.executionResults?.[0]?.actualOutput || '',
        error: executionResult.errorMessage || executionResult.executionResults?.[0]?.error,
        runtime: executionResult.runtime,
        verdict: executionResult.verdict,
        testCasesPassed: executionResult.testCasesPassed,
        totalTestCases: executionResult.totalTestCases || testCases.length,
        isSuccess: executionResult.verdict === VERDICT.ACCEPTED
      }, 'Code executed successfully')
    );
  } catch (error) {
    console.error('Error in runCode:', error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    res.status(500).json(
      ApiResponse.error({
        message: error.message || 'Failed to execute code',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, 'Code execution failed', 500)
    );
  }
});