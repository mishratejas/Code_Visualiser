import codeParser from './code-parser.js';

/**
 * Extract features from code for ML analysis
 */
class FeatureExtractor {
  /**
   * Extract all features from code
   */
  async extract(code, language, executionInfo = {}) {
    const features = {
      // Structural features
      linesOfCode: this.countLines(code),
      characterCount: code.length,
      functions: codeParser.extractFunctions(code, language).length,
      classes: codeParser.extractClasses(code, language).length,
      
      // Control flow features
      loops: codeParser.countLoops(code, language),
      conditionals: codeParser.countConditionals(code, language),
      cyclomaticComplexity: codeParser.calculateComplexity(code, language),
      
      // Imports/Dependencies
      imports: codeParser.extractImports(code, language),
      
      // Code metrics
      commentDensity: this.calculateCommentDensity(code, language),
      averageLineLength: this.calculateAverageLineLength(code),
      maxNestingDepth: this.calculateNestingDepth(code, language),
      
      // Algorithmic patterns (boolean flags)
      hasSorting: this.detectPattern(code, this.getSortingPatterns(language)),
      hasHashing: this.detectPattern(code, this.getHashingPatterns(language)),
      hasRecursion: this.detectPattern(code, this.getRecursionPatterns(language)),
      hasDynamicProgramming: this.detectPattern(code, ['dp[', 'memo', 'cache']),
      hasBinarySearch: this.detectPattern(code, ['mid =', 'binary']),
      
      // Execution info (if available)
      runtime: executionInfo.runtime || null,
      memory: executionInfo.memory || null,
      testsPassed: executionInfo.testsPassed || null,
      totalTests: executionInfo.totalTests || null,
      
      // Language-specific
      language
    };

    return features;
  }

  /**
   * Count non-empty, non-comment lines
   */
  countLines(code) {
    return code
      .split('\n')
      .filter(line => line.trim().length > 0)
      .filter(line => !line.trim().startsWith('//'))
      .filter(line => !line.trim().startsWith('#'))
      .length;
  }

  /**
   * Calculate comment density
   */
  calculateCommentDensity(code, language) {
    const totalLines = code.split('\n').length;
    if (totalLines === 0) return 0;

    let commentLines = 0;
    const lines = code.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (language === 'python') {
        if (trimmed.startsWith('#')) commentLines++;
      } else {
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          commentLines++;
        }
      }
    }

    return commentLines / totalLines;
  }

  /**
   * Calculate average line length
   */
  calculateAverageLineLength(code) {
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) return 0;

    const totalLength = lines.reduce((sum, line) => sum + line.length, 0);
    return totalLength / lines.length;
  }

  /**
   * Calculate maximum nesting depth
   */
  calculateNestingDepth(code, language) {
    const lines = code.split('\n');
    let maxDepth = 0;
    let currentDepth = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Increase depth on opening braces or indentation
      if (language === 'python') {
        // Count leading spaces
        const spaces = line.match(/^ */)[0].length;
        currentDepth = Math.floor(spaces / 4); // Assuming 4-space indentation
      } else {
        if (trimmed.endsWith('{')) currentDepth++;
        if (trimmed === '}' || trimmed.startsWith('}')) currentDepth--;
      }

      maxDepth = Math.max(maxDepth, currentDepth);
      currentDepth = Math.max(0, currentDepth);
    }

    return maxDepth;
  }

  /**
   * Detect pattern in code
   */
  detectPattern(code, patterns) {
    return patterns.some(pattern => code.toLowerCase().includes(pattern.toLowerCase()));
  }

  /**
   * Get sorting patterns for language
   */
  getSortingPatterns(language) {
    const patterns = {
      python: ['.sort()', 'sorted(', 'heapq'],
      javascript: ['.sort(', 'Array.sort'],
      cpp: ['std::sort', 'sort('],
      java: ['Arrays.sort', 'Collections.sort']
    };
    return patterns[language] || patterns.javascript;
  }

  /**
   * Get hashing patterns for language
   */
  getHashingPatterns(language) {
    const patterns = {
      python: ['dict', '{', 'set(', 'defaultdict', 'Counter'],
      javascript: ['Map', 'Set', '{}', 'Object'],
      cpp: ['unordered_map', 'unordered_set', 'map', 'set'],
      java: ['HashMap', 'HashSet', 'TreeMap', 'TreeSet']
    };
    return patterns[language] || patterns.javascript;
  }

  /**
   * Get recursion patterns for language
   */
  getRecursionPatterns(language) {
    // This is simplified - real recursion detection needs AST parsing
    return ['return', 'call', '('];
  }

  /**
   * Convert features to flat array for ML model
   */
  toArray(features) {
    return [
      features.linesOfCode,
      features.characterCount,
      features.functions,
      features.classes,
      features.loops,
      features.conditionals,
      features.cyclomaticComplexity,
      features.commentDensity,
      features.averageLineLength,
      features.maxNestingDepth,
      features.hasSorting ? 1 : 0,
      features.hasHashing ? 1 : 0,
      features.hasRecursion ? 1 : 0,
      features.hasDynamicProgramming ? 1 : 0,
      features.hasBinarySearch ? 1 : 0,
      features.runtime || 0,
      features.memory || 0
    ];
  }
}

export default new FeatureExtractor();