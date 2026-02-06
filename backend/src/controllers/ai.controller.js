import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import Submission from '../models/submission.models.js';
import Problem from '../models/problem.models.js';
import User from '../models/user.models.js';
import axios from 'axios';

// AI Service Client
class AIServiceClient {
    constructor() {
        this.baseURL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    async analyzeCode(submissionData) {
        try {
            const response = await this.client.post('/api/v1/analyze/submission', submissionData);
            return response.data;
        } catch (error) {
            console.error('AI Service error:', error.message);
            return this.getFallbackAnalysis(submissionData);
        }
    }

    async checkPlagiarism(contestId, submissions) {
        try {
            const response = await this.client.post('/api/v1/plagiarism/check', {
                contest_id: contestId,
                submissions: submissions
            });
            return response.data;
        } catch (error) {
            console.error('Plagiarism check error:', error.message);
            return {
                contest_id: contestId,
                suspicious_pairs: [],
                error: 'Plagiarism service unavailable'
            };
        }
    }

    async getRecommendations(userId, limit = 10) {
        try {
            const response = await this.client.post('/api/v1/recommendations/problems', {
                user_id: userId,
                limit: limit,
                include_solved: false
            });
            return response.data;
        } catch (error) {
            console.error('Recommendation error:', error.message);
            return [];
        }
    }

    getFallbackAnalysis(submissionData) {
        // Basic fallback analysis
        return {
            quality_score: 0.5,
            quality_label: 'fair',
            time_complexity: 'O(n)',
            space_complexity: 'O(1)',
            anti_patterns: [],
            suggestions: [
                'Consider adding comments to explain your logic',
                'Check for edge cases in your solution'
            ],
            confidence: 0.1
        };
    }
}

const aiClient = new AIServiceClient();

// @desc    Analyze a specific submission
// @route   POST /api/ai/submissions/:id/analyze
// @access  Private
export const analyzeSubmission = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`🤖 Analyzing submission ${id}`);
        
        const submission = await Submission.findOne({
            _id: id,
            user: req.user._id
        }).populate('problem', 'title difficulty constraints testCases');
        
        if (!submission) {
            throw ApiError.notFound('Submission not found');
        }
        
        // Prepare data for AI analysis
        const analysisData = {
            submission_id: submission._id.toString(),
            user_id: req.user._id.toString(),
            problem_id: submission.problem._id.toString(),
            code: submission.code,
            language: submission.language,
            execution_results: {
                runtime: submission.runtime,
                memory: submission.memory,
                test_cases_passed: submission.testCasesPassed,
                total_test_cases: submission.totalTestCases,
                verdict: submission.verdict
            },
            problem_constraints: submission.problem.constraints
        };
        
        // Call AI service
        const analysisResult = await aiClient.analyzeCode(analysisData);
        
        // Update submission with AI analysis
        submission.aiAnalysis = {
            complexity: {
                time: analysisResult.time_complexity,
                space: analysisResult.space_complexity
            },
            codeQuality: analysisResult.quality_score,
            suggestions: analysisResult.suggestions || [],
            vulnerabilities: analysisResult.anti_patterns || [],
            qualityLabel: analysisResult.quality_label,
            performanceRating: analysisResult.performance_rating,
            bottleneckAnalysis: analysisResult.bottleneck_analysis || [],
            confidence: analysisResult.confidence,
            analyzedAt: new Date()
        };
        
        await submission.save();
        
        console.log(`✅ AI analysis completed for submission ${id}`);
        
        res.status(200).json(
            ApiResponse.success(
                {
                    submission: submission,
                    analysis: analysisResult
                },
                'AI analysis completed successfully'
            )
        );
    } catch (error) {
        console.error('AI analysis error:', error);
        throw ApiError.internal('Failed to analyze submission: ' + error.message);
    }
});

// @desc    Get AI recommendations for user
// @route   GET /api/ai/recommendations
// @access  Private
export const getRecommendations = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const { limit = 10 } = req.query;
        
        console.log(`🤖 Getting recommendations for user ${userId}`);
        
        // Get recommendations from AI service
        const recommendations = await aiClient.getRecommendations(userId, parseInt(limit));
        
        // If AI service returns empty, get fallback recommendations
        let finalRecommendations = recommendations;
        if (!recommendations || recommendations.length === 0) {
            finalRecommendations = await getFallbackRecommendations(req.user._id, parseInt(limit));
        }
        
        res.status(200).json(
            ApiResponse.success(
                {
                    recommendations: finalRecommendations,
                    generated_at: new Date().toISOString()
                },
                'Recommendations fetched successfully'
            )
        );
    } catch (error) {
        console.error('Recommendations error:', error);
        throw ApiError.internal('Failed to get recommendations: ' + error.message);
    }
});

// Fallback recommendation logic
async function getFallbackRecommendations(userId, limit) {
    try {
        // Get user's solved problems
        const solvedSubmissions = await Submission.find({
            user: userId,
            verdict: 'accepted'
        }).distinct('problem');
        
        // Get user's attempted but not solved problems
        const attemptedSubmissions = await Submission.find({
            user: userId,
            verdict: { $ne: 'accepted' }
        }).distinct('problem');
        
        // Remove solved from attempted
        const attemptedOnly = attemptedSubmissions.filter(
            p => !solvedSubmissions.includes(p)
        );
        
        // Find problems based on attempted but not solved (learning from mistakes)
        const recommendations = [];
        
        // 1. Recommend problems similar to attempted but not solved
        if (attemptedOnly.length > 0) {
            const similarProblems = await Problem.find({
                _id: { $in: attemptedOnly.slice(0, 5) },
                'metadata.isPublished': true
            })
            .select('title difficulty tags metadata.acceptanceRate')
            .limit(Math.min(limit, 5));
            
            similarProblems.forEach(problem => {
                recommendations.push({
                    problem_id: problem._id,
                    title: problem.title,
                    difficulty: problem.difficulty,
                    score: 0.8,
                    reasons: [
                        'Similar to problems you attempted',
                        'Good opportunity to learn from past attempts'
                    ],
                    predicted_success_rate: 0.6
                });
            });
        }
        
        // 2. Fill with popular problems if needed
        if (recommendations.length < limit) {
            const popularProblems = await Problem.find({
                'metadata.isPublished': true,
                _id: { $nin: solvedSubmissions }
            })
            .sort({ 'metadata.acceptanceRate': -1 })
            .select('title difficulty tags metadata.acceptanceRate')
            .limit(limit - recommendations.length);
            
            popularProblems.forEach(problem => {
                recommendations.push({
                    problem_id: problem._id,
                    title: problem.title,
                    difficulty: problem.difficulty,
                    score: 0.6,
                    reasons: [
                        'High acceptance rate',
                        'Popular problem to practice'
                    ],
                    predicted_success_rate: problem.metadata.acceptanceRate / 100
                });
            });
        }
        
        return recommendations;
    } catch (error) {
        console.error('Fallback recommendations error:', error);
        return [];
    }
}

// @desc    Analyze user's skill gap
// @route   GET /api/ai/skill-gap
// @access  Private
export const getSkillGapAnalysis = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get user's submission stats by topic/difficulty
        const submissions = await Submission.find({ user: userId })
            .populate('problem', 'difficulty tags')
            .select('verdict problem runtime');
        
        // Calculate success rates by difficulty
        const difficultyStats = {
            easy: { total: 0, solved: 0, avgTime: 0 },
            medium: { total: 0, solved: 0, avgTime: 0 },
            hard: { total: 0, solved: 0, avgTime: 0 }
        };
        
        // Calculate topic performance
        const topicStats = {};
        const topicTimes = {};
        
        submissions.forEach(sub => {
            const problem = sub.problem;
            if (!problem) return;
            
            // Difficulty stats
            const diff = problem.difficulty?.toLowerCase() || 'medium';
            if (difficultyStats[diff]) {
                difficultyStats[diff].total++;
                if (sub.verdict === 'accepted') {
                    difficultyStats[diff].solved++;
                    difficultyStats[diff].avgTime += sub.runtime || 0;
                }
            }
            
            // Topic stats
            const tags = problem.tags || [];
            tags.forEach(tag => {
                if (!topicStats[tag]) {
                    topicStats[tag] = { total: 0, solved: 0 };
                    topicTimes[tag] = { totalTime: 0, count: 0 };
                }
                
                topicStats[tag].total++;
                if (sub.verdict === 'accepted') {
                    topicStats[tag].solved++;
                    topicTimes[tag].totalTime += sub.runtime || 0;
                    topicTimes[tag].count++;
                }
            });
        });
        
        // Calculate percentages and averages
        Object.keys(difficultyStats).forEach(diff => {
            const stats = difficultyStats[diff];
            stats.successRate = stats.total > 0 ? (stats.solved / stats.total) * 100 : 0;
            stats.avgTime = stats.solved > 0 ? Math.round(stats.avgTime / stats.solved) : 0;
        });
        
        const skillGap = {
            user_id: userId.toString(),
            difficulty_analysis: difficultyStats,
            topic_analysis: Object.keys(topicStats).map(tag => ({
                topic: tag,
                total_attempts: topicStats[tag].total,
                solved: topicStats[tag].solved,
                success_rate: topicStats[tag].total > 0 ? 
                    (topicStats[tag].solved / topicStats[tag].total) * 100 : 0,
                average_time: topicTimes[tag].count > 0 ? 
                    Math.round(topicTimes[tag].totalTime / topicTimes[tag].count) : 0
            })),
            weaknesses: [],
            strengths: [],
            recommendations: []
        };
        
        // Identify weaknesses (success rate < 50%)
        skillGap.topic_analysis.forEach(topic => {
            if (topic.success_rate < 50 && topic.total_attempts >= 3) {
                skillGap.weaknesses.push({
                    topic: topic.topic,
                    success_rate: topic.success_rate,
                    suggestion: `Practice more ${topic.topic} problems. Focus on understanding the patterns.`
                });
            } else if (topic.success_rate >= 70 && topic.total_attempts >= 3) {
                skillGap.strengths.push({
                    topic: topic.topic,
                    success_rate: topic.success_rate,
                    message: `Strong performance in ${topic.topic}`
                });
            }
        });
        
        // Generate recommendations
        if (skillGap.weaknesses.length > 0) {
            skillGap.recommendations.push(
                `Focus on improving your ${skillGap.weaknesses.map(w => w.topic).join(', ')} skills.`
            );
        }
        
        if (difficultyStats.hard.successRate < 30) {
            skillGap.recommendations.push(
                'Practice more hard problems to improve problem-solving skills.'
            );
        }
        
        res.status(200).json(
            ApiResponse.success(
                skillGap,
                'Skill gap analysis completed'
            )
        );
    } catch (error) {
        console.error('Skill gap analysis error:', error);
        throw ApiError.internal('Failed to analyze skill gap: ' + error.message);
    }
});

// @desc    Get real-time code analysis
// @route   POST /api/ai/analyze/code
// @access  Private
export const analyzeCode = asyncHandler(async (req, res) => {
    try {
        const { code, language, problemId } = req.body;
        const userId = req.user._id.toString();
        
        if (!code || !language) {
            throw ApiError.badRequest('Code and language are required');
        }
        
        const analysisData = {
            submission_id: `temp_${Date.now()}`,
            user_id: userId,
            problem_id: problemId || 'general',
            code: code,
            language: language,
            execution_results: {
                runtime: 0,
                memory: 0,
                test_cases_passed: 0,
                total_test_cases: 0,
                verdict: 'pending'
            }
        };
        
        const analysisResult = await aiClient.analyzeCode(analysisData);
        
        res.status(200).json(
            ApiResponse.success(
                analysisResult,
                'Code analysis completed'
            )
        );
    } catch (error) {
        console.error('Code analysis error:', error);
        throw ApiError.internal('Failed to analyze code: ' + error.message);
    }
});

// @desc    Start AI interview session
// @route   POST /api/ai/interview/start
// @access  Private
export const startInterview = asyncHandler(async (req, res) => {
    try {
        const { difficulty, topics, duration } = req.body;
        const userId = req.user._id.toString();
        
        // Call AI interview service
        const response = await axios.post(
            `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/api/v1/interview/start`,
            {
                user_id: userId,
                difficulty: difficulty || 'medium',
                topics: topics || [],
                duration_minutes: duration || 30
            }
        );
        
        // Store interview session in user data
        await User.findByIdAndUpdate(req.user._id, {
            $push: {
                interviewSessions: {
                    interviewId: response.data.interview_id,
                    startedAt: new Date(),
                    difficulty: difficulty || 'medium',
                    topics: topics || []
                }
            }
        });
        
        res.status(200).json(
            ApiResponse.success(
                response.data,
                'Interview session started'
            )
        );
    } catch (error) {
        console.error('Interview start error:', error);
        throw ApiError.internal('Failed to start interview: ' + error.message);
    }
});

// @desc    Run plagiarism check for contest
// @route   POST /api/ai/plagiarism/check
// @access  Admin only
export const runPlagiarismCheck = asyncHandler(async (req, res) => {
    try {
        const { contestId } = req.body;
        
        if (req.user.role !== 'admin') {
            throw ApiError.forbidden('Only admins can run plagiarism checks');
        }
        
        // Get all submissions for the contest
        const submissions = await Submission.find({
            contestId: contestId,
            verdict: { $ne: 'pending' }
        })
        .populate('user', 'username')
        .select('code language user problem verdict');
        
        if (submissions.length < 2) {
            throw ApiError.badRequest('Need at least 2 submissions for plagiarism check');
        }
        
        // Format submissions for AI service
        const formattedSubmissions = submissions.map(sub => ({
            id: sub._id.toString(),
            user_id: sub.user._id.toString(),
            username: sub.user.username,
            code: sub.code,
            language: sub.language,
            problem_id: sub.problem?.toString(),
            verdict: sub.verdict
        }));
        
        // Call plagiarism service
        const result = await aiClient.checkPlagiarism(contestId, formattedSubmissions);
        
        res.status(200).json(
            ApiResponse.success(
                result,
                'Plagiarism check completed'
            )
        );
    } catch (error) {
        console.error('Plagiarism check error:', error);
        throw ApiError.internal('Failed to run plagiarism check: ' + error.message);
    }
});