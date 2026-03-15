import Submission from "../models/submission.models.js";
import Problem from "../models/problem.models.js";
import User from "../models/user.models.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import notificationService from "../services/notification.service.js";
import axios from "axios";
import ApiError from "../utils/ApiError.js";
import { exec, execFile, spawn } from "child_process";
import { promisify } from "util";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { VERDICT } from "../constants.js";
import { v4 as uuidv4 } from "uuid";
import achievementService from "../services/achievement.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8001";

// ─── Output size limit: 2MB ───────────────────────────────────────────────────
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;

// ─── Sandbox configuration ────────────────────────────────────────────────────
// Three modes: 'docker' (most secure), 'ulimit' (Linux only), 'basic' (Windows/dev)
// Set SANDBOX_MODE in .env — defaults to 'basic' for local dev
const SANDBOX_MODE = process.env.SANDBOX_MODE || 'basic';
const DOCKER_IMAGE  = process.env.JUDGE_DOCKER_IMAGE || 'codearena-judge:latest';

/**
 * Sandboxed code runner
 *
 * MODES:
 *  docker  → each submission runs in a disposable Docker container
 *            memory=256m, cpus=0.5, no network, read-only fs, pids=50
 *            → MOST SECURE — use in production
 *
 *  ulimit  → Linux ulimit restricts memory + file size
 *            → MEDIUM — use on Linux VPS without Docker
 *
 *  basic   → Only timeout SIGKILL + output size limit
 *            → DEVELOPMENT ONLY — never use in production
 */
const runCodeSandboxed = async ({ execCmd, execArgs, inputData, timeoutMs, language }) => {
  if (SANDBOX_MODE === 'docker') {
    return runInDocker({ execCmd, execArgs, inputData, timeoutMs, language });
  }
  if (SANDBOX_MODE === 'ulimit' && os.platform() !== 'win32') {
    return runWithUlimit({ execCmd, execArgs, inputData, timeoutMs });
  }
  return runBasic({ execCmd, execArgs, inputData, timeoutMs });
};


// ─── Docker sandbox ───────────────────────────────────────────────────────────
const runInDocker = async ({ execCmd, execArgs, inputData, timeoutMs, language }) => {
  const containerName = `judge_${uuidv4().replace(/-/g, '')}`;

  // Write input to temp file on host (Docker will mount it)
  const hostTmp = path.join(os.tmpdir(), `input_${containerName}.txt`);
  fs.writeFileSync(hostTmp, inputData || '');

  const dockerArgs = [
    'run', '--rm',
    '--name', containerName,
    '--memory', '256m',           // max RAM
    '--memory-swap', '256m',      // disable swap
    '--cpus', '0.5',              // 50% of one CPU
    '--network', 'none',          // NO internet access
    '--read-only',                // read-only filesystem
    '--tmpfs', '/tmp:size=16m',   // only /tmp writable, RAM-based, 16MB
    '--pids-limit', '50',         // prevents fork bombs
    '--user', 'nobody',           // non-root
    '-i',
    DOCKER_IMAGE,
    execCmd, ...execArgs,
  ];

  return new Promise((resolve) => {
    let outData = '';
    let errData = '';
    const killed = { byTimeout: false, byOutput: false };

    const docker = spawn('docker', dockerArgs, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Feed input
    if (inputData) {
      docker.stdin.write(inputData);
      docker.stdin.end();
    }

    docker.stdout.on('data', (chunk) => {
      outData += chunk.toString();
      if (Buffer.byteLength(outData) > MAX_OUTPUT_BYTES) {
        killed.byOutput = true;
        docker.kill('SIGKILL');
        execAsync(`docker kill ${containerName}`).catch(() => {});
      }
    });
    docker.stderr.on('data', (chunk) => { errData += chunk.toString(); });

    const timer = setTimeout(() => {
      killed.byTimeout = true;
      docker.kill('SIGKILL');
      execAsync(`docker kill ${containerName}`).catch(() => {});
    }, timeoutMs);

    docker.on('close', (code) => {
      clearTimeout(timer);
      try { fs.unlinkSync(hostTmp); } catch {}
      if (killed.byTimeout) {
        resolve({ stdout: '', stderr: 'Time Limit Exceeded', timedOut: true, exitCode: -1 });
      } else if (killed.byOutput) {
        resolve({ stdout: outData.slice(0, 1000), stderr: 'Output Limit Exceeded', exitCode: -1 });
      } else {
        resolve({ stdout: outData, stderr: errData, exitCode: code });
      }
    });

    docker.on('error', (err) => {
      clearTimeout(timer);
      resolve({ stdout: '', stderr: `Docker error: ${err.message}`, exitCode: -1 });
    });
  });
};


// ─── ulimit sandbox (Linux/Mac) ───────────────────────────────────────────────
const runWithUlimit = ({ execCmd, execArgs, inputData, timeoutMs }) => {
  return new Promise((resolve) => {
    let outData = '';
    let errData = '';

    const proc = spawn('bash', [
      '-c',
      // ulimit: virtual memory 256MB, file size 32MB, processes 50
      `ulimit -v 262144 -f 32768 -u 50; ${execCmd} ${execArgs.join(' ')}`,
    ], { stdio: ['pipe', 'pipe', 'pipe'] });

    if (inputData) { proc.stdin.write(inputData); proc.stdin.end(); }

    proc.stdout.on('data', (chunk) => {
      outData += chunk.toString();
      if (Buffer.byteLength(outData) > MAX_OUTPUT_BYTES) proc.kill('SIGKILL');
    });
    proc.stderr.on('data', (chunk) => { errData += chunk.toString(); });

    const timer = setTimeout(() => proc.kill('SIGKILL'), timeoutMs);
    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({ stdout: outData, stderr: errData, exitCode: code });
    });
    proc.on('error', (e) => {
      clearTimeout(timer);
      resolve({ stdout: '', stderr: e.message, exitCode: -1 });
    });
  });
};


// ─── Basic sandbox (Windows / dev only) ──────────────────────────────────────
const runBasic = ({ execCmd, execArgs, inputData, timeoutMs }) => {
  return new Promise((resolve) => {
    let outData = '';
    let errData = '';
    let killed = false;

    const proc = spawn(execCmd, execArgs, {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    if (inputData) { proc.stdin.write(inputData); proc.stdin.end(); }

    proc.stdout.on('data', (chunk) => {
      outData += chunk.toString();
      if (Buffer.byteLength(outData) > MAX_OUTPUT_BYTES) {
        killed = true;
        proc.kill('SIGKILL');
      }
    });
    proc.stderr.on('data', (chunk) => { errData += chunk.toString(); });

    const timer = setTimeout(() => {
      killed = true;
      proc.kill('SIGKILL');
    }, timeoutMs);

    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({ stdout: outData, stderr: errData, exitCode: code, killed, timedOut: killed });
    });
    proc.on('error', (e) => {
      clearTimeout(timer);
      resolve({ stdout: '', stderr: e.message, exitCode: -1, killed: true });
    });
  });
};


// Optimized code execution with better performance
const executeCode = async (code, language, testCases, timeLimit, memoryLimit) => {
  const results = [];
  let maxRuntime = 0;  // wall-clock: parallel tests, max = actual slowest
  let totalRuntime = 0; // sum of all test case runtimes
  let testCasesPassed = 0;

  // Create temp directory
  const tempDir = path.join(__dirname, "../../temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const uniqueId = uuidv4().slice(0, 8);
  const fileName = `solution_${uniqueId}`;
  let filePath, executablePath, className;

  try {
    // Write code to file based on language
    switch (language) {
      case "python":
        filePath = path.join(tempDir, `${fileName}.py`);
        fs.writeFileSync(filePath, code);
        break;
      case "javascript":
        filePath = path.join(tempDir, `${fileName}.cjs`);
        fs.writeFileSync(filePath, code);
        break;
      case "cpp":
        filePath = path.join(tempDir, `${fileName}.cpp`);
        fs.writeFileSync(filePath, code);
        executablePath = path.join(tempDir, fileName + (process.platform === "win32" ? ".exe" : ""));
        
        // Compile C++ with optimizations
        try {
          const compileCmd = `g++ -std=c++17 -O2 "${filePath}" -o "${executablePath}"`;
          const { stderr } = await execAsync(compileCmd, { timeout: 10000 });
          if (stderr && !stderr.includes("warning")) {
            return {
              verdict: VERDICT.COMPILATION_ERROR,
              runtime: 0,
              testCasesPassed: 0,
              errorMessage: stderr,
              executionResults: testCases.map((tc, i) => ({
                testCaseIndex: i,
                passed: false,
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                actualOutput: "",
                error: "Compilation Error",
              })),
            };
          }
        } catch (compileError) {
          return {
            verdict: VERDICT.COMPILATION_ERROR,
            runtime: 0,
            testCasesPassed: 0,
            errorMessage: compileError.stderr || "Compilation failed",
            executionResults: testCases.map((tc, i) => ({
              testCaseIndex: i,
              passed: false,
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              actualOutput: "",
              error: "Compilation Error",
            })),
          };
        }
        break;
      case "java":
        filePath = path.join(tempDir, `${fileName}.java`);
        className = code.match(/public\s+class\s+(\w+)/)?.[1] || "Solution";
        fs.writeFileSync(filePath, code);
        
        // Compile Java
        try {
          const compileCmd = `javac "${filePath}"`;
          const { stderr } = await execAsync(compileCmd, { timeout: 10000 });
          if (stderr) {
            return {
              verdict: VERDICT.COMPILATION_ERROR,
              runtime: 0,
              testCasesPassed: 0,
              errorMessage: stderr,
              executionResults: testCases.map((tc, i) => ({
                testCaseIndex: i,
                passed: false,
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                actualOutput: "",
                error: "Compilation Error",
              })),
            };
          }
        } catch (compileError) {
          return {
            verdict: VERDICT.COMPILATION_ERROR,
            runtime: 0,
            testCasesPassed: 0,
            errorMessage: compileError.stderr || "Compilation failed",
            executionResults: testCases.map((tc, i) => ({
              testCaseIndex: i,
              passed: false,
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              actualOutput: "",
              error: "Compilation Error",
            })),
          };
        }
        break;
      default:
        throw new Error(`Unsupported language: ${language}`);
    }

    // Process test cases in parallel for better performance
    const testCasePromises = testCases.map(async (testCase, index) => {
      const startTime = Date.now();
      
      // Prepare input
      let input = testCase.input;
      if (input.includes('\\n')) {
        input = input.replace(/\\n/g, '\n');
      }
      if (!input.endsWith('\n')) {
        input += '\n';
      }
      const inputFile = path.join(tempDir, `input_${uniqueId}_${index}.txt`);
      fs.writeFileSync(inputFile, input);

      try {
        // ── Sandboxed execution ────────────────────────────────────────────
        // Determine command based on language
        let execCmd, execArgs;
        switch (language) {
          case "python":
            execCmd = process.platform === "win32" ? "python" : "python3";
            execArgs = [filePath];
            break;
          case "javascript":
            execCmd = "node";
            execArgs = [filePath];
            break;
          case "cpp":
            execCmd = executablePath;
            execArgs = [];
            break;
          case "java":
            execCmd = "java";
            execArgs = ["-cp", tempDir, className];
            break;
        }

        const sandboxResult = await runCodeSandboxed({
          execCmd,
          execArgs,
          inputData: input,
          timeoutMs: timeLimit,
          language,
        });

        // Clean up input file
        try { fs.unlinkSync(inputFile); } catch (e) {}

        const { stdout, stderr } = sandboxResult;
        if (sandboxResult.timedOut) {
          throw { message: "Time Limit Exceeded", stderr: "" };
        }
        if (sandboxResult.exitCode !== 0 && stderr && !stdout) {
          throw { message: `Runtime error`, stderr };
        }

        const runtime = Date.now() - startTime;
        
        // Clean outputs
        const normalizeOutput = (s) =>
          (s || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
            .split('\n').map(l => l.trimEnd()).join('\n').trim();

        const actualOutput   = normalizeOutput(stdout);
        const expectedOutput = normalizeOutput(testCase.expectedOutput);
        const passed = actualOutput === expectedOutput;

        return {
          testCaseIndex: index,
          passed,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: actualOutput,
          runtime,
          memory: 0,
          error: stderr || null,
        };
      } catch (execError) {
        const runtime = Date.now() - startTime;
        const errMsg = execError.message || execError.stderr || 'Execution error';

        return {
          testCaseIndex: index,
          passed: false,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: "",
          runtime,
          memory: 0,
          error: errMsg,
        };
      }
    });

    // Execute all test cases in parallel
    const executedResults = await Promise.all(testCasePromises);
    
    // Process results
    for (const result of executedResults) {
      results.push(result);
      totalRuntime += result.runtime;
      if (result.runtime > maxRuntime) maxRuntime = result.runtime;
      if (result.passed) testCasesPassed++;
    }

    // Clean up compiled files
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (language === "cpp" && fs.existsSync(executablePath)) fs.unlinkSync(executablePath);
      if (language === "java") {
        const classFile = path.join(tempDir, `${fileName}.class`);
        if (fs.existsSync(classFile)) fs.unlinkSync(classFile);
      }
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    // Determine verdict based on what actually failed
    let verdict = VERDICT.ACCEPTED;
    if (testCasesPassed < testCases.length) {
      const hasTLE = results.some(r => r.error && r.error.includes('Time Limit'));
      const hasRE  = results.some(r => r.error && !r.error.includes('Time Limit') && r.actualOutput === '');
      if (hasTLE)       verdict = VERDICT.TIME_LIMIT_EXCEEDED;
      else if (hasRE)   verdict = VERDICT.RUNTIME_ERROR;
      else              verdict = VERDICT.WRONG_ANSWER;
    }

    return {
      verdict,
      runtime: Math.max(0, maxRuntime - 150), // subtract spawn overhead (~150ms)
      displayRuntime: Math.max(0, maxRuntime - 150), // reported to user (algorithm time only)
      rawMaxRuntime: maxRuntime,               // wall-clock max (for debugging)
      avgRuntime: testCases.length > 0 ? Math.round(totalRuntime / testCases.length) : 0,
      testCasesPassed,
      totalTestCases: testCases.length,
      executionResults: results,
    };

  } catch (error) {
    console.error("Execution error:", error);
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
        actualOutput: "",
        error: "Execution failed",
      })),
    };
  }
};

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

  // Execute code asynchronously
  const executionResult = await executeCode(
    code,
    language,
    problem.testCases || [],
    problem.constraints?.timeLimit || 2000,
    problem.constraints?.memoryLimit || 256,
  );

  // Update submission with results
  submission.verdict = executionResult.verdict;
  submission.runtime = executionResult.displayRuntime ?? executionResult.runtime;
  submission.testCasesPassed = executionResult.testCasesPassed;
  submission.executionResults = executionResult.executionResults;
  submission.errorMessage = executionResult.errorMessage;
  submission.executionTime = Date.now() - submission.createdAt;

  await submission.save();

  // Update user stats (run in background, don't await)
  updateUserStats(userId, problem, executionResult.verdict, problemId, isResubmit)
    .catch(err => console.error("Error updating user stats:", err));

  // Check & unlock achievements (background, non-blocking)
  achievementService.checkSubmissionAchievements(userId, {
    verdict: executionResult.verdict,
    executionTime: Date.now() - submission.createdAt,
  }).catch(err => console.error("Achievement check error:", err));

  // Update problem stats (run in background, don't await)
  updateProblemStats(problemId, executionResult.verdict)
    .catch(err => console.error("Error updating problem stats:", err));

  // Send notification (background, non-blocking)
  notificationService.notifySubmission(userId, {
    status: executionResult.verdict,
    problemTitle: problem.title,
    executionTime: executionResult.runtime || 0,
    testCasesPassed: executionResult.testCasesPassed || 0,
    totalTestCases: problem.testCases?.length || 0,
    submissionId: submission._id,
  }).catch(err => console.error("Notification error:", err));

  // Request AI analysis in background (non-blocking)
  axios.post(`${AI_SERVICE_URL}/api/v1/analyze/code`, {
    code: submission.code,
    language: submission.language,
    submission_id: submission._id.toString(),
    runtime_ms: executionResult.runtime || 0,
    test_cases_passed: executionResult.testCasesPassed || 0,
    total_test_cases: problem.testCases?.length || 0,
  }, { timeout: 30000 })
    .then(res => {
      if (res.data?.data) {
        Submission.findByIdAndUpdate(submission._id, { aiAnalysis: res.data.data }).catch(() => {});
      }
    })
    .catch(() => {}); // Silently ignore — AI service may not be running

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
    },
  };

  // Only include execution results in development
  if (process.env.NODE_ENV === "development") {
    responseData.executionResults = submission.executionResults;
  }

  res.status(201).json(
    ApiResponse.created(
      responseData,
      executionResult.verdict === VERDICT.ACCEPTED
        ? "🎉 Problem solved successfully!"
        : "Code executed. Check results.",
    ),
  );
});

// Helper function to update user stats
async function updateUserStats(userId, problem, verdict, problemId, isResubmit) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Initialize stats if needed
    user.stats = user.stats || {};
    user.stats.totalSubmissions = (user.stats.totalSubmissions || 0) + 1;

    if (verdict === VERDICT.ACCEPTED) {
      user.stats.acceptedSubmissions = (user.stats.acceptedSubmissions || 0) + 1;

      // Only increment solved count if it's a new problem
      if (!isResubmit) {
        user.stats.totalProblemsSolved = (user.stats.totalProblemsSolved || 0) + 1;

        // Update difficulty counts
        if (problem.difficulty === "easy") {
          user.stats.easySolved = (user.stats.easySolved || 0) + 1;
        } else if (problem.difficulty === "medium") {
          user.stats.mediumSolved = (user.stats.mediumSolved || 0) + 1;
        } else if (problem.difficulty === "hard") {
          user.stats.hardSolved = (user.stats.hardSolved || 0) + 1;
        }

        // Add to solved problems array
        if (!user.solvedProblems) user.solvedProblems = [];
        if (!user.solvedProblems.includes(problemId)) {
          user.solvedProblems.push(problemId);
        }
      }
    }

    // Add to attempted problems
    if (!user.attemptedProblems) user.attemptedProblems = [];
    if (!user.attemptedProblems.includes(problemId)) {
      user.attemptedProblems.push(problemId);
    }

    await user.save();
  } catch (error) {
    console.error("Error in updateUserStats:", error);
  }
}

// Helper function to update problem stats
async function updateProblemStats(problemId, verdict) {
  try {
    const problem = await Problem.findById(problemId);
    if (!problem) return;

    problem.metadata = problem.metadata || {};
    problem.metadata.submissions = (problem.metadata.submissions || 0) + 1;

    if (verdict === VERDICT.ACCEPTED) {
      problem.metadata.acceptedSubmissions = (problem.metadata.acceptedSubmissions || 0) + 1;
    }

    // Update acceptance rate
    if (problem.metadata.submissions > 0) {
      problem.metadata.acceptanceRate = Math.round(
        ((problem.metadata.acceptedSubmissions || 0) / problem.metadata.submissions) * 100
      );
    }

    await problem.save();
  } catch (error) {
    console.error("Error in updateProblemStats:", error);
  }
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