import axios from 'axios';
import PlagiarismReport from '../models/plagiarism.models.js';
import Submission from '../models/submission.models.js';
import Contest from '../models/postgres/Contest.models.js';
import ContestSubmission from '../models/postgres/ContestSubmission.models.js';
import logger from '../config/logger.js';

class PlagiarismService {
  constructor() {
    // ✅ FIX: AI service runs on port 8001, NOT 8000
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001';
    this.threshold = 0.85;
  }

  /**
   * Check plagiarism for all submissions in a contest.
   * Works by:
   *  1. Getting all ContestSubmission records (PostgreSQL) to find submission IDs
   *  2. Loading the actual code from MongoDB Submission records
   *  3. Sending to AI service for Winnowing + AST analysis
   */
  async checkContest(contestId, checkedBy = null) {
    try {
      // Step 1 — get all contest submission records from PostgreSQL
      const contestSubs = await ContestSubmission.findAll({
        where: { contest_id: contestId },
        attributes: ['submission_id', 'user_id', 'problem_id', 'language'],
      });

      if (contestSubs.length < 2) {
        return {
          totalSubmissions: contestSubs.length,
          suspiciousPairs: [],
          averageSimilarity: 0,
          message: 'Not enough submissions to run plagiarism check',
        };
      }

      // Step 2 — load code from MongoDB using the submission_id references
      const submissionIds = contestSubs.map(s => s.submission_id).filter(Boolean);
      const mongoSubs = await Submission.find({ _id: { $in: submissionIds } })
        .select('_id code language user')
        .populate('user', 'username email')
        .lean();

      // Build a lookup map: submission_id → mongo doc
      const subMap = Object.fromEntries(mongoSubs.map(s => [s._id.toString(), s]));

      // Merge: use ContestSubmission metadata + MongoDB code
      const submissions = contestSubs
        .map(cs => {
          const mongo = subMap[cs.submission_id];
          if (!mongo?.code) return null;
          return {
            submission_id: cs.submission_id,
            user_id: cs.user_id,
            code: mongo.code,
            language: cs.language || mongo.language,
            username: mongo.user?.username || cs.user_id,
          };
        })
        .filter(Boolean);

      if (submissions.length < 2) {
        return {
          totalSubmissions: contestSubs.length,
          suspiciousPairs: [],
          averageSimilarity: 0,
          message: 'Could not load code for enough submissions',
        };
      }

      // Step 3 — send to AI service for analysis
      const response = await axios.post(
        `${this.aiServiceUrl}/api/v1/plagiarism/check`,
        {
          contest_id: String(contestId),
          submissions: submissions.map(s => ({
            submission_id: s.submission_id,
            user_id: s.user_id,
            code: s.code,
            language: s.language,
          })),
        },
        { timeout: 120000 }  // 2 minutes for large contests
      );

      const aiData = response.data?.data || response.data;

      // Step 4 — save report to MongoDB
      const report = new PlagiarismReport({
        contest: contestId,
        totalSubmissions: submissions.length,
        checkedBy,
        checkedAt: new Date(),
        status: 'completed',
        averageSimilarity: aiData.average_similarity || 0,
        suspiciousPairs: (aiData.suspicious_pairs || []).map(pair => {
          const s1 = submissions.find(s => s.submission_id === pair.submission1_id);
          const s2 = submissions.find(s => s.submission_id === pair.submission2_id);
          return {
            submission1: pair.submission1_id,
            submission2: pair.submission2_id,
            user1: s1?.user_id,
            user2: s2?.user_id,
            similarityScore: pair.similarity_score,
            tokenSimilarity: pair.winnowing_similarity ?? pair.token_similarity,
            astSimilarity: pair.ast_similarity,
            structuralSimilarity: pair.ast_similarity,
            isSuspicious: pair.similarity_score >= this.threshold,
          };
        }),
      });

      await report.save();
      return report;

    } catch (error) {
      logger.error('Plagiarism check failed:', error.message);
      // Return a partial result rather than crashing
      throw new Error(`Plagiarism check failed: ${error.message}`);
    }
  }

  /**
   * Automatically run plagiarism check after a contest ends.
   * Called from contestJobs.js when status transitions to 'ended'.
   */
  async autoCheckOnContestEnd(contestId) {
    try {
      logger.info(`Auto-running plagiarism check for contest ${contestId}`);
      const report = await this.checkContest(contestId, null);
      const suspicious = report.suspiciousPairs?.length || 0;
      logger.info(`Plagiarism check done: ${suspicious} suspicious pair(s) found for contest ${contestId}`);
      return report;
    } catch (err) {
      logger.error(`Auto plagiarism check failed for contest ${contestId}:`, err.message);
    }
  }

  /**
   * Get plagiarism report for a contest
   */
  async getReport(contestId) {
    const report = await PlagiarismReport.findOne({ contest: contestId })
      .sort({ checkedAt: -1 })
      .populate('suspiciousPairs.user1', 'username email')
      .populate('suspiciousPairs.user2', 'username email');

    if (!report) {
      throw new Error('No plagiarism report found for this contest');
    }

    return report;
  }

  /**
   * Compare two specific submissions
   */
  async compareTwo(submission1Id, submission2Id) {
    try {
      const [sub1, sub2] = await Promise.all([
        Submission.findById(submission1Id).select('code language user'),
        Submission.findById(submission2Id).select('code language user'),
      ]);

      if (!sub1 || !sub2) throw new Error('One or both submissions not found');

      const response = await axios.post(
        `${this.aiServiceUrl}/api/v1/plagiarism/compare`,
        {
          submission1: { id: submission1Id, user_id: String(sub1.user), code: sub1.code, language: sub1.language },
          submission2: { id: submission2Id, user_id: String(sub2.user), code: sub2.code, language: sub2.language },
        },
        { timeout: 20000 }
      );

      return response.data?.data || response.data;
    } catch (error) {
      logger.error('Comparison failed:', error.message);
      throw new Error('Failed to compare submissions');
    }
  }

  /**
   * Mark pair as reviewed
   */
  async reviewPair(contestId, submission1Id, submission2Id, verdict, notes, reviewedBy) {
    const report = await PlagiarismReport.findOne({ contest: contestId });
    if (!report) throw new Error('Report not found');

    const pair = report.suspiciousPairs.find(
      p => (p.submission1.toString() === submission1Id && p.submission2.toString() === submission2Id) ||
           (p.submission1.toString() === submission2Id && p.submission2.toString() === submission1Id)
    );

    if (!pair) throw new Error('Pair not found in report');

    pair.reviewed   = true;
    pair.reviewedBy = reviewedBy;
    pair.verdict    = verdict;
    pair.reviewNotes = notes;

    await report.save();
    return report;
  }
}

export default new PlagiarismService();