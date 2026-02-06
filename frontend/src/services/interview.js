import api from './api.js';

const interviewService = {
    // Start a new interview session
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

    // Submit solution for current question
    submitSolution: async (interviewId, code, explanation = '') => {
        try {
            const response = await api.post(`/ai/interview/${interviewId}/submit`, {
                code,
                explanation
            });
            return response.data;
        } catch (error) {
            console.error('Failed to submit solution:', error);
            throw error;
        }
    },

    // Check explanation quality
    checkExplanation: async (code, explanation, questionId) => {
        try {
            const response = await api.post('/ai/interview/check-explanation', {
                code,
                explanation,
                question_id: questionId
            });
            return response.data;
        } catch (error) {
            console.error('Failed to check explanation:', error);
            throw error;
        }
    },

    // Get hint for current question
    getHint: async (question, currentApproach = '') => {
        try {
            const response = await api.post('/ai/interview/hint', {
                question,
                current_approach: currentApproach
            });
            return response.data;
        } catch (error) {
            console.error('Failed to get hint:', error);
            throw error;
        }
    },

    // Get interview report
    getReport: async (interviewId) => {
        try {
            const response = await api.get(`/ai/interview/${interviewId}/report`);
            return response.data;
        } catch (error) {
            console.error('Failed to get report:', error);
            throw error;
        }
    },

    // Get follow-up questions
    getFollowUp: async (interviewId, previousAnswer) => {
        try {
            const response = await api.post(`/ai/interview/${interviewId}/follow-up`, {
                previous_answer: previousAnswer
            });
            return response.data;
        } catch (error) {
            console.error('Failed to get follow-up:', error);
            throw error;
        }
    },

    // WebSocket connection for real-time interview
    connectWebSocket: (interviewId) => {
        const wsUrl = `ws://${window.location.host}/api/ai/interview/${interviewId}/ws`;
        const socket = new WebSocket(wsUrl);
        
        return socket;
    },

    // Mock data for development
    mockQuestions: [
        {
            id: 'two-sum',
            title: 'Two Sum',
            description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
            difficulty: 'easy',
            topics: ['array', 'hash-table'],
            constraints: {
                time_complexity: 'O(n)',
                space_complexity: 'O(n)'
            },
            examples: [
                {
                    input: 'nums = [2,7,11,15], target = 9',
                    output: '[0,1]',
                    explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
                }
            ]
        },
        {
            id: 'reverse-linked-list',
            title: 'Reverse Linked List',
            description: 'Given the head of a singly linked list, reverse the list and return the new head.',
            difficulty: 'easy',
            topics: ['linked-list'],
            constraints: {
                time_complexity: 'O(n)',
                space_complexity: 'O(1)'
            },
            examples: [
                {
                    input: 'head = [1,2,3,4,5]',
                    output: '[5,4,3,2,1]',
                    explanation: 'The list is reversed.'
                }
            ]
        }
    ]
};

export default interviewService;