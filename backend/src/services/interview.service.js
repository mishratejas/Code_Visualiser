import InterviewSession from '../models/interview.models.js';
import logger from '../config/logger.js';
import axios from 'axios';

class InterviewService {
  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  /**
   * Start a new interview session
   */
  async startSession({ userId, difficulty, topics, duration }) {
    try {
      // Call AI service to get a question
      const response = await axios.post(
        `${this.aiServiceUrl}/api/v1/interview/start`,
        {
          user_id: userId,
          difficulty,
          topics,
          duration_minutes: duration
        },
        { timeout: 10000 }
      );

      const { interview_id, question, started_at, expires_at } = response.data;

      // Create interview session
      const interview = new InterviewSession({
        user: userId,
        difficulty,
        topics,
        question,
        startedAt: new Date(started_at),
        expiresAt: new Date(expires_at),
        duration,
        status: 'active'
      });

      await interview.save();

      return interview;
    } catch (error) {
      logger.error('Failed to start interview:', error.message);
      throw new Error('Failed to start interview session');
    }
  }

  /**
   * Submit answer for interview question
   */
  async submitAnswer({ interviewId, userId, code, explanation }) {
    try {
      const interview = await InterviewSession.findOne({
        _id: interviewId,
        user: userId
      });

      if (!interview) {
        throw new Error('Interview session not found');
      }

      if (interview.isExpired()) {
        interview.status = 'expired';
        await interview.save();
        throw new Error('Interview session has expired');
      }

      // Call AI service for evaluation
      const response = await axios.post(
        `${this.aiServiceUrl}/api/v1/interview/${interviewId}/submit`,
        {
          code,
          explanation
        },
        { timeout: 20000 }
      );

      const evaluation = response.data.evaluation;

      // Add answer to interview
      interview.answers.push({
        code,
        explanation,
        language: 'python', // TODO: detect language
        evaluation: {
          correctness: evaluation.correctness || 0,
          complexity: evaluation.complexity || 'Unknown',
          codeQuality: evaluation.code_quality || 0,
          explanationQuality: evaluation.explanation_quality || 0,
          overallScore: evaluation.score || 0
        }
      });

      // Update status if completed
      if (evaluation.score >= 70) {
        interview.status = 'completed';
        interview.completedAt = new Date();
        interview.finalScore = interview.calculateFinalScore();
      }

      await interview.save();

      return {
        evaluation,
        followUp: response.data.follow_up_question,
        status: interview.status
      };
    } catch (error) {
      logger.error('Failed to submit answer:', error.message);
      throw error;
    }
  }

  /**
   * Generate interview report
   */
  async generateReport({ interviewId, userId }) {
    try {
      const interview = await InterviewSession.findOne({
        _id: interviewId,
        user: userId
      }).populate('user', 'username email');

      if (!interview) {
        throw new Error('Interview not found');
      }

      // Call AI service for detailed report
      const response = await axios.get(
        `${this.aiServiceUrl}/api/v1/interview/${interviewId}/report`,
        { timeout: 15000 }
      );

      interview.report = response.data;
      await interview.save();

      return response.data;
    } catch (error) {
      logger.error('Failed to generate report:', error.message);
      
      // Generate basic report locally
      return this.generateLocalReport(interview);
    }
  }

  /**
   * Generate local report (fallback)
   */
  generateLocalReport(interview) {
    const avgScore = interview.calculateFinalScore();

    const report = {
      overallScore: avgScore,
      strengths: [],
      weaknesses: [],
      recommendations: [],
      overallFeedback: ''
    };

    if (avgScore >= 80) {
      report.strengths.push('Strong problem-solving skills');
      report.strengths.push('Good code quality');
      report.overallFeedback = 'Excellent performance!';
    } else if (avgScore >= 60) {
      report.strengths.push('Decent understanding of concepts');
      report.weaknesses.push('Could improve code optimization');
      report.overallFeedback = 'Good effort, keep practicing';
    } else {
      report.weaknesses.push('Needs more practice with algorithms');
      report.recommendations.push('Review data structures');
      report.overallFeedback = 'Keep working on fundamentals';
    }

    return report;
  }

  /**
   * Get interview history
   */
  async getHistory({ userId, page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    const interviews = await InterviewSession.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-answers.code'); // Don't include code in list

    const total = await InterviewSession.countDocuments({ user: userId });

    return {
      interviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

export default new InterviewService();