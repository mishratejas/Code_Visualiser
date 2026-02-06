import axios from 'axios';
import PlagiarismReport from '../models/plagiarism.models.js';
import Submission from '../models/submission.models.js';
import logger from '../config/logger.js';

class PlagiarismService {
  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.threshold = 0.85;
  }

  /**
   * Check plagiarism for all submissions in a contest
   */
  async checkContest(contestId) {
    try {
      // Get all submissions for the contest
      const submissions = await Submission.find({ contestId })
        .select('_id user code language problem')
        .populate('user', 'username email')
        .lean();

      if (submissions.length < 2) {
        throw new Error('Not enough submissions to check');
      }

      // Call AI service for plagiarism check
      const response = await axios.post(
        `${this.aiServiceUrl}/api/v1/plagiarism/check`,
        {
          contest_id: contestId,
          submissions: submissions.map(sub => ({
            submission_id: sub._id.toString(),
            user_id: sub.user._id.toString(),
            code: sub.code,
            language: sub.language
          }))
        },
        { timeout: 60000 } // 60 seconds for large contests
      );

      // Save report to database
      const report = new PlagiarismReport({
        contest: contestId,
        totalSubmissions: submissions.length,
        suspiciousPairs: response.data.suspicious_pairs.map(pair => ({
          submission1: pair.submission1_id,
          submission2: pair.submission2_id,
          user1: submissions.find(s => s._id.toString() === pair.submission1_id)?.user._id,
          user2: submissions.find(s => s._id.toString() === pair.submission2_id)?.user._id,
          similarityScore: pair.similarity_score,
          tokenSimilarity: pair.token_similarity,
          astSimilarity: pair.ast_similarity,
          structuralSimilarity: pair.structural_similarity,
          isSuspicious: pair.similarity_score >= this.threshold
        })),
        averageSimilarity: response.data.average_similarity,
        checkedAt: new Date(),
        checkedBy: null, // TODO: add admin user
        status: 'completed'
      });

      await report.save();

      return report;
    } catch (error) {
      logger.error('Plagiarism check failed:', error.message);
      throw new Error('Failed to check plagiarism');
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
        Submission.findById(submission2Id).select('code language user')
      ]);

      if (!sub1 || !sub2) {
        throw new Error('One or both submissions not found');
      }

      // Call AI service
      const response = await axios.post(
        `${this.aiServiceUrl}/api/v1/plagiarism/compare`,
        {
          submission1: {
            id: submission1Id,
            code: sub1.code,
            language: sub1.language
          },
          submission2: {
            id: submission2Id,
            code: sub2.code,
            language: sub2.language
          }
        },
        { timeout: 20000 }
      );

      return response.data;
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

    if (!report) {
      throw new Error('Report not found');
    }

    const pair = report.suspiciousPairs.find(
      p => (p.submission1.toString() === submission1Id && 
            p.submission2.toString() === submission2Id) ||
           (p.submission1.toString() === submission2Id && 
            p.submission2.toString() === submission1Id)
    );

    if (!pair) {
      throw new Error('Pair not found in report');
    }

    pair.reviewed = true;
    pair.reviewedBy = reviewedBy;
    pair.verdict = verdict;
    pair.reviewNotes = notes;

    await report.save();

    return report;
  }
}

export default new PlagiarismService();