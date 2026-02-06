import axios from 'axios';
import config from '../config/index.js';
import logger from '../config/logger.js';
import AIAnalysis from '../models/ai.models.js';

class AIService {
  constructor() {
    this.aiServiceUrl = config.aiService.url || 'http://localhost:8000';
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Analyze code submission using AI service
   */
  async analyzeCode({ submissionId, code, language, userId }) {
    try {
      const response = await axios.post(
        `${this.aiServiceUrl}/api/v1/analyze/submission`,
        {
          submission_id: submissionId,
          user_id: userId,
          code,
          language
        },
        { timeout: this.timeout }
      );

      // Save analysis to database
      const analysis = new AIAnalysis({
        submission: submissionId,
        user: userId,
        ...response.data
      });

      await analysis.save();

      return response.data;
    } catch (error) {
      logger.error('AI analysis failed:', error.message);
      throw new Error('AI analysis service unavailable');
    }
  }

  /**
   * Generate hints for a problem
   */
  async generateHints({ problemId, userCode, difficulty, userId }) {
    try {
      // TODO: Implement hint generation with AI
      // For now, return generic hints
      return {
        hints: [
          'Think about the edge cases',
          'Consider the time complexity of your solution',
          'Try to optimize the space usage'
        ]
      };
    } catch (error) {
      logger.error('Hint generation failed:', error.message);
      throw new Error('Failed to generate hints');
    }
  }

  /**
   * Analyze time and space complexity
   */
  async analyzeComplexity({ code, language }) {
    try {
      const response = await axios.post(
        `${this.aiServiceUrl}/api/v1/analyze/complexity`,
        { code, language },
        { timeout: this.timeout }
      );

      return response.data;
    } catch (error) {
      logger.error('Complexity analysis failed:', error.message);
      throw new Error('Complexity analysis failed');
    }
  }

  /**
   * Get ML-based problem recommendations
   */
  async getRecommendations({ userId, limit = 10 }) {
    try {
      const response = await axios.get(
        `${this.aiServiceUrl}/api/v1/recommendations`,
        {
          params: { user_id: userId, limit },
          timeout: this.timeout
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Recommendations failed:', error.message);
      throw new Error('Failed to fetch recommendations');
    }
  }

  /**
   * Get analysis history for a user
   */
  async getAnalysisHistory(userId, { page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;

    const analyses = await AIAnalysis.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('problem', 'title slug difficulty')
      .populate('submission', 'verdict runtime memory');

    const total = await AIAnalysis.countDocuments({ user: userId });

    return {
      analyses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

export default new AIService();