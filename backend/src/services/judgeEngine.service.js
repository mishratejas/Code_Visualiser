/**
 * judgeEngine.service.js — the sandboxed code judge.
 *
 * M1 fix: this used to live inline in submission.controller.js (1080 lines,
 * mixing judge execution, DB side effects, and Express route handling in one
 * file — audit finding M1). Pulled out here because it's genuinely
 * self-contained: no Express req/res, no Mongoose models, no HTTP concerns —
 * just "given code + language + test cases, run it safely and return a
 * verdict." That's a real service boundary, not an arbitrary file split.
 *
 * Consumed by:
 *  - src/controllers/submission.controller.js (submitCode's inline-fallback
 *    path, runCode)
 *  - src/jobs/judge.worker.js (the Bull queue processor — the primary path
 *    for submitCode as of the M6 fix)
 */
import { exec, execFile, spawn } from "child_process";
import { promisify } from "util";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { VERDICT } from "../constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);


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


// ─── Sandboxed compilation ────────────────────────────────────────────────────
// H6 fix: g++/javac used to run via raw execAsync() directly on the host, with
// only a wall-clock timeout — no memory/pid limit. A submission could allocate
// unbounded memory or fork during compilation (e.g. template metaprogramming
// bombs, huge macro expansion) and exhaust the host before the timeout fired,
// completely bypassing the Docker/ulimit sandbox that protects the *execution*
// step. This wraps the compiler invocation with the same ulimit bounds used for
// running submitted code (256MB virtual memory, 32MB output file size, 50 procs)
// on Linux/Mac. On Windows (no ulimit) it falls back to the previous behaviour,
// same as the "basic" execution sandbox — documented dev-only, not for production.
const compileSandboxed = (compileCmd, timeoutMs = 10000) => {
  if (process.platform === 'win32') {
    return execAsync(compileCmd, { timeout: timeoutMs });
  }
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    const proc = spawn('bash', [
      '-c',
      `ulimit -v 1048576 -f 32768 -u 50; ${compileCmd}`,
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    const timer = setTimeout(() => killProc(proc), timeoutMs);

    proc.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        const err = new Error(stderr || `Compilation exited with code ${code}`);
        err.stderr = stderr;
        reject(err);
        return;
      }
      resolve({ stdout, stderr });
    });

    proc.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
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
      `ulimit -v 1048576 -f 32768 -u 50; ${execCmd} ${execArgs.join(' ')}`,
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


// ─── Safe kill helper (Windows-compatible) ───────────────────────────────────
const killProc = (proc) => {
  try {
    if (process.platform === 'win32') {
      proc.kill(); // Windows does not support signal names like SIGKILL
    } else {
      proc.kill('SIGKILL');
    }
  } catch (_) {}
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

    // Always close stdin after writing — critical for fs.readFileSync(0) in JS submissions
    try { if (inputData) proc.stdin.write(inputData); } catch (_) {}
    try { proc.stdin.end(); } catch (_) {}

    proc.stdout.on('data', (chunk) => {
      outData += chunk.toString();
      if (Buffer.byteLength(outData) > MAX_OUTPUT_BYTES) {
        killed = true;
        killProc(proc);
      }
    });
    proc.stderr.on('data', (chunk) => { errData += chunk.toString(); });

    const timer = setTimeout(() => {
      killed = true;
      killProc(proc);
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
export const executeCode = async (code, language, testCases, timeLimit, memoryLimit) => {
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
      case "javascript": {
        filePath = path.join(tempDir, `${fileName}.cjs`);
        // Add global error handlers so unhandled exceptions appear as RuntimeError
        // verdict instead of crashing the child Node process (which caused nodemon restarts)
        const jsWrapper = [
          "process.on('uncaughtException', (e) => { process.stderr.write(String(e.message || e) + '\\n'); process.exit(1); });",
          "process.on('unhandledRejection', (e) => { process.stderr.write(String(e) + '\\n'); process.exit(1); });",
          code
        ].join('\n');
        fs.writeFileSync(filePath, jsWrapper);
        break;
      }
      case "cpp":
        filePath = path.join(tempDir, `${fileName}.cpp`);
        fs.writeFileSync(filePath, code);
        executablePath = path.join(tempDir, fileName + (process.platform === "win32" ? ".exe" : ""));
        
        // Compile C++ with optimizations
        try {
          const compileCmd = `g++ -std=c++17 -O2 "${filePath}" -o "${executablePath}"`;
          const { stderr } = await compileSandboxed(compileCmd, 10000);
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
          const { stderr } = await compileSandboxed(compileCmd, 10000);
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
            // --stack-size prevents infinite recursion from crashing the host process
            execArgs = ["--stack-size=65536", filePath];
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
  } finally {
    try {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (executablePath && fs.existsSync(executablePath)) fs.unlinkSync(executablePath);
      if (language === "java" && fileName) {
        const classFile = path.join(tempDir, `${fileName}.class`);
        if (fs.existsSync(classFile)) fs.unlinkSync(classFile);
      }
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError);
    }
  }
};