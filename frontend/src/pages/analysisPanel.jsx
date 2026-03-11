/**
 * AnalysisPanel.jsx
 * Displays AI code analysis results (complexity, quality, anti-patterns, suggestions)
 * Uses Zustand analysisStore — no prop drilling needed
 */
import React, { useState } from 'react';
import { Brain, Clock, MemoryStick, AlertTriangle, CheckCircle, Lightbulb, TrendingUp, Loader2 } from 'lucide-react';
import useAnalysisStore from '../store/analysisStore';

const QUALITY_COLORS = {
  excellent: 'text-green-400',
  good:      'text-blue-400',
  fair:      'text-yellow-400',
  poor:      'text-red-400',
};

const SEVERITY_COLORS = {
  high:   'bg-red-900/40 border-red-500/30 text-red-300',
  medium: 'bg-yellow-900/40 border-yellow-500/30 text-yellow-300',
  low:    'bg-blue-900/40 border-blue-500/30 text-blue-300',
};

const RATING_BADGE = {
  optimized:   'bg-green-500/20 text-green-400 border border-green-500/30',
  acceptable:  'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  inefficient: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

export default function AnalysisPanel({ code, language, submissionId, runtimeMs, testCasesPassed, totalTestCases }) {
  const { analyzeCode, currentAnalysis, loading, error } = useAnalysisStore();
  const [analysisKey] = useState(submissionId || `${language}:${code?.slice(0, 20)}`);
  const isLoading = loading[analysisKey];
  const errMsg    = error[analysisKey];
  const analysis  = useAnalysisStore(s => s.analyses[analysisKey]) || currentAnalysis;

  const handleAnalyze = () => {
    analyzeCode({ code, language, submissionId, runtimeMs, testCasesPassed, totalTestCases });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3 text-gray-400">
        <Loader2 className="animate-spin w-8 h-8 text-purple-400" />
        <p className="text-sm">Analyzing code with Gemini AI...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-6 text-center">
        <Brain className="w-10 h-10 text-purple-400 mx-auto mb-3" />
        <p className="text-gray-400 text-sm mb-4">
          Get AI-powered analysis: complexity, quality score, anti-patterns & suggestions
        </p>
        {errMsg && <p className="text-red-400 text-xs mb-3">{errMsg}</p>}
        <button
          onClick={handleAnalyze}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
        >
          Analyze Code
        </button>
      </div>
    );
  }

  const m = analysis.metrics || {};

  return (
    <div className="p-4 space-y-4 text-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-purple-400 font-medium">
          <Brain className="w-4 h-4" />
          <span>AI Analysis</span>
        </div>
        <button onClick={handleAnalyze} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
          Re-analyze
        </button>
      </div>

      {/* Complexity Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
            <Clock className="w-3 h-3" /> Time Complexity
          </div>
          <div className="text-white font-mono font-semibold">{analysis.time_complexity || '—'}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
            <MemoryStick className="w-3 h-3" /> Space Complexity
          </div>
          <div className="text-white font-mono font-semibold">{analysis.space_complexity || '—'}</div>
        </div>
      </div>

      {/* Quality + Performance */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
          <div className="text-gray-400 text-xs mb-1">Quality</div>
          <div className={`font-semibold capitalize ${QUALITY_COLORS[analysis.quality_label] || 'text-gray-300'}`}>
            {analysis.quality_label || '—'}
          </div>
          {analysis.quality_score != null && (
            <div className="mt-1 h-1.5 bg-gray-700 rounded-full">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${Math.round((analysis.quality_score || 0) * 100)}%` }}
              />
            </div>
          )}
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
          <div className="text-gray-400 text-xs mb-1">Performance</div>
          {analysis.performance_rating && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${RATING_BADGE[analysis.performance_rating]}`}>
              {analysis.performance_rating}
            </span>
          )}
        </div>
      </div>

      {/* Structural Metrics */}
      {Object.keys(m).length > 0 && (
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
          <div className="text-gray-400 text-xs mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" /> Metrics
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {[
              ['Lines of code', m.lines_of_code],
              ['Functions', m.function_count],
              ['Loops', m.loop_count],
              ['Cyclomatic complexity', m.cyclomatic_complexity],
              ['Max nesting depth', m.max_nesting_depth],
              ['Comment density', m.comment_density != null ? `${Math.round(m.comment_density * 100)}%` : null],
            ].filter(([, v]) => v != null).map(([label, val]) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500">{label}</span>
                <span className="text-gray-300">{val}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {m.uses_recursion     && <Tag>Recursive</Tag>}
            {m.uses_dp            && <Tag>DP</Tag>}
            {m.uses_binary_search && <Tag>Binary Search</Tag>}
            {m.uses_sorting       && <Tag>Sorting</Tag>}
            {m.uses_hashmap       && <Tag>Hash Map</Tag>}
          </div>
        </div>
      )}

      {/* Anti-patterns */}
      {analysis.anti_patterns?.length > 0 && (
        <div>
          <div className="text-gray-400 text-xs mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" /> Anti-patterns
          </div>
          <div className="space-y-1.5">
            {analysis.anti_patterns.map((ap, i) => (
              <div key={i} className={`rounded p-2 border text-xs ${SEVERITY_COLORS[ap.severity] || SEVERITY_COLORS.low}`}>
                <span className="font-medium capitalize">{ap.type?.replace(/_/g, ' ')}</span>
                {' — '}{ap.description}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {analysis.suggestions?.length > 0 && (
        <div>
          <div className="text-gray-400 text-xs mb-2 flex items-center gap-1.5">
            <Lightbulb className="w-3 h-3" /> Suggestions
          </div>
          <ul className="space-y-1.5">
            {analysis.suggestions.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs text-gray-300">
                <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Algorithm detected */}
      {analysis.algorithm_detected && (
        <div className="text-xs text-gray-500">
          Algorithm: <span className="text-gray-300 capitalize">{analysis.algorithm_detected}</span>
        </div>
      )}
    </div>
  );
}

function Tag({ children }) {
  return (
    <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
      {children}
    </span>
  );
}