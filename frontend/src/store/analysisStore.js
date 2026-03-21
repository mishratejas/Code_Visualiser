/**
 * analysisStore.js — Zustand store for code analysis state
 */
import { create } from 'zustand';
import api from '../services/api';

const useAnalysisStore = create((set, get) => ({
  // State
  analyses: {},          // key → analysis result
  loading: {},           // key → boolean
  error: {},             // key → error message
  currentAnalysis: null,

  // Actions
  analyzeCode: async ({
    code, language, submissionId = '',
    runtimeMs = 0, testCasesPassed = 0, totalTestCases = 0,
    forceRefresh = false,
  }) => {
    // Build a collision-resistant cache key.
    // Old code used code.slice(0,20) which causes collisions across different
    // problems that share the same boilerplate opening lines (e.g. #include, import).
    const codeHash = code
      ? [...code].reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0).toString(36)
      : 'empty';
    const key = submissionId ? `sub:${submissionId}` : `code:${language}:${codeHash}`;

    // Return cached result only if not forcing a re-analysis
    if (!forceRefresh && get().analyses[key]) {
      set({ currentAnalysis: get().analyses[key] });
      return get().analyses[key];
    }

    set(s => ({ loading: { ...s.loading, [key]: true }, error: { ...s.error, [key]: null } }));

    try {
      const res = await api.post('/ai/analyze', {
        code,
        language,
        submission_id: submissionId,
        runtime_ms: runtimeMs,
        test_cases_passed: testCasesPassed,
        total_test_cases: totalTestCases,
        force_refresh: forceRefresh,
      });

      // Axios interceptor unwraps response.data → res is ApiResponse:
      // { success: true, data: { time_complexity, ... } }
      const data = res?.data ?? res;

      set(s => ({
        analyses: { ...s.analyses, [key]: data },
        currentAnalysis: data,
        loading: { ...s.loading, [key]: false },
      }));
      return data;
    } catch (err) {
      const status = err.response?.status;
      let msg = 'Analysis failed';
      if (status === 503 || err.code === 'ECONNREFUSED') {
        msg = 'AI service is offline — start it with: cd ai-service && uvicorn src.main:app --port 8001';
      } else if (status === 401) {
        msg = 'Authentication required';
      } else {
        msg = err.response?.data?.message || err.response?.data?.detail || 'Analysis failed';
      }
      set(s => ({ loading: { ...s.loading, [key]: false }, error: { ...s.error, [key]: msg } }));
      return null;
    }
  },

  clearAnalysis: (key) => set(s => {
    const { [key]: _, ...rest } = s.analyses;
    return { analyses: rest, currentAnalysis: null };
  }),

  clearAll: () => set({ analyses: {}, loading: {}, error: {}, currentAnalysis: null }),
}));

export default useAnalysisStore;