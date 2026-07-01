import judgeQueue from './judge.queue.js';
import { executeCode } from '../services/judgeEngine.service.js';
import { updateUserStats, updateProblemStats } from '../services/submissionStats.service.js';
import Submission from '../models/submission.models.js';
import Problem from '../models/problem.models.js';
import notificationService from '../services/notification.service.js';
import achievementService from '../services/achievement.service.js';
import { VERDICT } from '../constants.js';

// How many submissions this process judges at once. Each one spins up a
// Docker container (in docker sandbox mode) or a spawned child process
// (ulimit/basic mode), so this should stay conservative on small hosts.
// Override with JUDGE_CONCURRENCY in .env for bigger deployments.
const CONCURRENCY = parseInt(process.env.JUDGE_CONCURRENCY) || 3;

judgeQueue.process(CONCURRENCY, async (job) => {
  const {
    submissionId, code, language, testCases, timeLimit, memoryLimit,
    userId, problemId, isResubmit, problemTitle,
  } = job.data;

  const submission = await Submission.findById(submissionId);
  if (!submission) {
    // Submission was deleted (or the DB write raced the job) — nothing to
    // judge or update. Not a failure, just a no-op.
    console.warn(`Judge job ${job.id}: submission ${submissionId} no longer exists, skipping`);
    return { skipped: true };
  }

  const problem = await Problem.findById(problemId);
  if (!problem) {
    submission.verdict = VERDICT.RUNTIME_ERROR;
    submission.errorMessage = 'Problem no longer exists';
    await submission.save();
    return { verdict: submission.verdict };
  }

  const executionResult = await executeCode(code, language, testCases, timeLimit, memoryLimit);

  submission.verdict = executionResult.verdict;
  submission.runtime = executionResult.displayRuntime ?? executionResult.runtime;
  submission.testCasesPassed = executionResult.testCasesPassed;
  submission.executionResults = executionResult.executionResults;
  submission.errorMessage = executionResult.errorMessage;
  submission.executionTime = Date.now() - submission.createdAt;
  await submission.save();

  // Same background side effects submitCode() used to fire inline — kept
  // fire-and-forget here too, since none of them should block marking this
  // job complete, and a failure in one (e.g. notification) shouldn't fail
  // the whole judged submission or trigger a Bull retry of the judging itself.
  updateUserStats(userId, problem, executionResult.verdict, problemId, isResubmit)
    .catch(err => console.error('Error updating user stats:', err));

  achievementService.checkSubmissionAchievements(userId, {
    verdict: executionResult.verdict,
    executionTime: submission.executionTime,
  }).catch(err => console.error('Achievement check error:', err));

  updateProblemStats(problemId, executionResult.verdict)
    .catch(err => console.error('Error updating problem stats:', err));

  notificationService.notifySubmission(userId, {
    status: executionResult.verdict,
    problemTitle: problemTitle,
    executionTime: executionResult.runtime || 0,
    testCasesPassed: executionResult.testCasesPassed || 0,
    totalTestCases: testCases.length || 0,
    submissionId: submission._id,
  }).catch(err => console.error('Notification error:', err));

  return { verdict: executionResult.verdict };
});

console.log(`✅ Judge worker started (concurrency: ${CONCURRENCY})`);

export default judgeQueue;