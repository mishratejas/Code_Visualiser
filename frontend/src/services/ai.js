import api from './api.js';

const aiService = {
    // Analyze a specific submission
    analyzeSubmission: async (submissionId) => {
        try {
            const response = await api.post(`/ai/submissions/${submissionId}/analyze`);
            return response.data;
        } catch (error) {
            console.error('Failed to analyze submission:', error);
            throw error;
        }
    },

    // Get personalized recommendations
    getRecommendations: async (limit = 10) => {
        try {
            const response = await api.get('/ai/recommendations', {
                params: { limit }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to get recommendations:', error);
            throw error;
        }
    },

    // Get skill gap analysis
    getSkillGap: async () => {
        try {
            const response = await api.get('/ai/skill-gap');
            return response.data;
        } catch (error) {
            console.error('Failed to get skill gap:', error);
            throw error;
        }
    },

    // Analyze code in real-time
    analyzeCode: async (code, language, problemId = null) => {
        try {
            const response = await api.post('/ai/analyze/code', {
                code,
                language,
                problemId
            });
            return response.data;
        } catch (error) {
            console.error('Failed to analyze code:', error);
            throw error;
        }
    },

    // Start AI interview
    startInterview: async (difficulty = 'medium', topics = [], duration = 30) => {
        try {
            const response = await api.post('/ai/interview/start', {
                difficulty,
                topics,
                duration
            });
            return response.data;
        } catch (error) {
            console.error('Failed to start interview:', error);
            throw error;
        }
    },

    // Get learning path
    getLearningPath: async (topic = null) => {
        try {
            const response = await api.get('/ai/learning-path', {
                params: { topic }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to get learning path:', error);
            throw error;
        }
    },

    // Similar problems
    getSimilarProblems: async (problemId, limit = 5) => {
        try {
            const response = await api.get(`/ai/similar/${problemId}`, {
                params: { limit }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to get similar problems:', error);
            throw error;
        }
    },

    // Check plagiarism (admin only)
    checkPlagiarism: async (contestId) => {
        try {
            const response = await api.post('/ai/plagiarism/check', {
                contestId
            });
            return response.data;
        } catch (error) {
            console.error('Failed to check plagiarism:', error);
            throw error;
        }
    },

    // Compare with benchmark
    compareWithBenchmark: async (submissionData, benchmarkData) => {
        try {
            const response = await api.post('/ai/compare', {
                submission_data: submissionData,
                benchmark_data: benchmarkData
            });
            return response.data;
        } catch (error) {
            console.error('Failed to compare with benchmark:', error);
            throw error;
        }
    }
};

export default aiService;