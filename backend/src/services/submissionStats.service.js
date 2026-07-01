/**
 * submissionStats.service.js — post-judge DB side effects.
 *
 * M1 fix (continued): extracted from submission.controller.js, which mixed
 * three separate concerns in one 1080-line file — judge execution (now
 * judgeEngine.service.js), these stats-update side effects, and Express
 * route handling. These two functions update User/Problem documents after a
 * submission has been judged; they don't touch req/res and don't know
 * anything about HTTP, so they don't belong in the controller.
 *
 * Consumed by:
 *  - src/controllers/submission.controller.js (submitCode's inline-fallback
 *    path)
 *  - src/jobs/judge.worker.js (the Bull queue processor — the primary path
 *    for submitCode as of the M6 fix)
 */
import User from "../models/user.models.js";
import Problem from "../models/problem.models.js";
import { VERDICT } from "../constants.js";

// Update a user's aggregate stats (solved counts, streak-relevant fields,
// attempted/solved problem lists) after a submission is judged.
export async function updateUserStats(userId, problem, verdict, problemId, isResubmit) {
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

        // Add to solved problems array.
        // Schema expects objects { problem, solvedAt, ... }, not bare IDs.
        if (!user.solvedProblems) user.solvedProblems = [];
        const alreadySolved = user.solvedProblems.some(
          sp => sp.problem?.toString() === problemId.toString()
        );
        if (!alreadySolved) {
          user.solvedProblems.push({
            problem:          problemId,
            solvedAt:         new Date(),
            firstSolve:       true,
            submissionsCount: 1,
          });
        }
      }
    }

    // Add to attempted problems.
    // Schema expects objects { problem, lastAttempt, attemptsCount, solved }, not bare IDs.
    if (!user.attemptedProblems) user.attemptedProblems = [];
    const existingAttempt = user.attemptedProblems.find(
      ap => ap.problem?.toString() === problemId.toString()
    );
    if (!existingAttempt) {
      user.attemptedProblems.push({
        problem:       problemId,
        lastAttempt:   new Date(),
        attemptsCount: 1,
        solved:        verdict === 'accepted',
      });
    } else {
      existingAttempt.lastAttempt   = new Date();
      existingAttempt.attemptsCount = (existingAttempt.attemptsCount || 0) + 1;
      if (verdict === 'accepted') existingAttempt.solved = true;
    }

    await user.save();
  } catch (error) {
    console.error("Error in updateUserStats:", error);
  }
}

// Update a problem's aggregate submission/acceptance stats after a
// submission is judged.
export async function updateProblemStats(problemId, verdict) {
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