/**
 * analysisStore.js — module-level store for code analysis state.
 *
 * M7 fix: this used to be a Zustand store, but Zustand was installed and
 * used in exactly this one file (audit finding M7) — everything else in the
 * app uses React Context. A single-consumer dependency like that is exactly
 * the kind of partial adoption the audit called out as its own form of
 * technical debt: either commit to it everywhere or drop it.
 *
 * We dropped it. What this store actually needs — module-level state that
 * survives component unmount/remount (so re-opening the analysis panel
 * doesn't lose a previous Gemini call) and that notifies subscribed
 * components on change — is exactly what React's built-in
 * `useSyncExternalStore` hook is for. No extra dependency required.
 *
 * Public shape is unchanged on purpose: `useAnalysisStore()` still returns
 * `{ analyses, loading, error, currentAnalysis, analyzeCode, clearAnalysis,
 * clearAll }`, so this is a drop-in replacement — analysisPanel.jsx (the
 * only consumer) needed zero changes.
 */
import { useSyncExternalStore } from 'react';
import api from '../services/api';

let state = {
  analyses: {},          // key → analysis result
  loading: {},           // key → boolean
  error: {},             // key → error message
  currentAnalysis: null,
};

const listeners = new Set();

function setState(patch) {
  state = typeof patch === 'function' ? patch(state) : { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

async function analyzeCode({
  code, language, submissionId = '',
  runtimeMs = 0, testCasesPassed = 0, totalTestCases = 0,
  forceRefresh = false,
}) {
  // Build a collision-resistant cache key.
  // Old code used code.slice(0,20) which causes collisions across different
  // problems that share the same boilerplate opening lines (e.g. #include, import).
  const codeHash = code
    ? [...code].reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0).toString(36)
    : 'empty';
  const key = submissionId ? `sub:${submissionId}` : `code:${language}:${codeHash}`;

  // Return cached result only if not forcing a re-analysis
  if (!forceRefresh && state.analyses[key]) {
    setState((s) => ({ ...s, currentAnalysis: s.analyses[key] }));
    return state.analyses[key];
  }

  setState((s) => ({
    ...s,
    loading: { ...s.loading, [key]: true },
    error: { ...s.error, [key]: null },
  }));

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

    setState((s) => ({
      ...s,
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
    setState((s) => ({
      ...s,
      loading: { ...s.loading, [key]: false },
      error: { ...s.error, [key]: msg },
    }));
    return null;
  }
}

function clearAnalysis(key) {
  setState((s) => {
    const { [key]: _, ...rest } = s.analyses;
    return { ...s, analyses: rest, currentAnalysis: null };
  });
}

function clearAll() {
  setState({ analyses: {}, loading: {}, error: {}, currentAnalysis: null });
}

export default function useAnalysisStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);
  return {
    ...snapshot,
    analyzeCode,
    clearAnalysis,
    clearAll,
  };
}