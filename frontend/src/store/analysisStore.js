/**
 * analysisStore.js — Zustand store for code analysis state
 *
 * WHERE ZUSTAND IS USED IN THIS PROJECT:
 *   - This file: code analysis results per submission (replaces prop-drilling)
 *   - CodeEditor state is managed locally with React context (EditorContext.jsx)
 *   - Auth state is in AuthContext (React context) — could migrate to Zustand later
 *
 * WHY ZUSTAND HERE:
 *   The analysis panel in Problem.jsx needs results from the AI service.
 *   Multiple components (AnalysisPanel, SubmissionItem) need to read the same
 *   analysis result. Zustand avoids passing it through props across levels.
 */
import { create } from 'zustand';
import api from '../services/api';

const useAnalysisStore = create((set, get) => ({
  // State
  analyses: {},          // submissionId → analysis result
  loading: {},           // submissionId → boolean
  error: {},             // submissionId → error message
  currentAnalysis: null, // Most recently requested analysis

  // Actions
  analyzeCode: async ({ code, language, submissionId = '', runtimeMs = 0, testCasesPassed = 0, totalTestCases = 0 }) => {
    const key = submissionId || `${language}:${code.slice(0, 20)}`;

    // Return cached if available
    if (get().analyses[key]) {
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
      });
      const data = res.data?.data || res.data;
      set(s => ({
        analyses: { ...s.analyses, [key]: data },
        currentAnalysis: data,
        loading: { ...s.loading, [key]: false },
      }));
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Analysis failed';
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