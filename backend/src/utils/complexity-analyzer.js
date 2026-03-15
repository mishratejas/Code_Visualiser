/**
 * Complexity Analyzer — accurate, context-aware static analysis
 *
 * Key fixes over the old version:
 *  1. hashMap detection no longer fires on bare `{}` in JS.
 *     We require `new Map`, `new Set`, or explicit variable assignments.
 *  2. nestedLoops counts actual structural nesting using a brace-stack,
 *     not by counting every line that mentions a loop keyword.
 *  3. Time-complexity priority chain is context-aware:
 *     two-pointer / merge patterns → O(n), not O(n²).
 *  4. Space-complexity correctly returns O(1) for in-place algorithms.
 *  5. Algorithm fingerprint recognises common patterns (two-pointer,
 *     merge, sliding window, etc.) and overrides generic heuristics.
 */
class ComplexityAnalyzer {
  async analyze(code, language) {
    const cleanCode = this.removeComments(code, language);
    const patterns  = this.detectPatterns(cleanCode, language);
    const algo      = this.detectAlgorithmFingerprint(cleanCode, language);

    const timeComplexity  = this.estimateTimeComplexity(patterns, algo);
    const spaceComplexity = this.estimateSpaceComplexity(patterns, algo);

    return {
      time:       timeComplexity,
      space:      spaceComplexity,
      patterns,
      algorithm:  algo,
      confidence: this.calculateConfidence(patterns, algo),
    };
  }

  // ── Algorithm fingerprint ────────────────────────────────────────────────────
  detectAlgorithmFingerprint(code, language) {
    const c = code.toLowerCase();

    const isBinarySearch = this._isBinarySearch(c);

    const isTwoPointer =
      !isBinarySearch && (
        (c.includes('left') && c.includes('right')) ||
        (c.includes('i') && c.includes('j') && c.includes('k') &&
          (c.includes('nums1') || c.includes('arr') || c.includes('merge')))
      );

    const isMergeSorted =
      c.includes('merge') ||
      (c.includes('sorted') && (c.includes('nums1') || c.includes('nums2') || c.includes('arr'))) ||
      (isTwoPointer && (c.includes('nums1') || c.includes('arr1')));

    const isSlidingWindow =
      c.includes('window') ||
      (c.includes('left') && c.includes('right') && c.includes('sum'));

    const isDivideConquer =
      this.detectRecursion(code, language) &&
      (c.includes('mid') || c.includes('middle') || c.includes('merge'));

    const isTwoSum =
      c.includes('twosum') ||
      (c.includes('target') && (c.includes('map') || c.includes('hash') || c.includes('dict') || c.includes('set')));

    return {
      twoPointer:    isTwoPointer && !isBinarySearch,
      mergeSorted:   isMergeSorted,
      slidingWindow: isSlidingWindow,
      divideConquer: isDivideConquer,
      binarySearch:  isBinarySearch,
      twoSum:        isTwoSum,
    };
  }

  _isBinarySearch(c) {
    const indicators = ['mid =', 'mid=', 'low <= high', 'left <= right', 'lo <= hi', 'binary_search', 'binarysearch'];
    return indicators.filter(p => c.includes(p)).length >= 2;
  }

  // ── Pattern detection ────────────────────────────────────────────────────────
  detectPatterns(code, language) {
    return {
      nestedLoops:        this.countNestedLoops(code, language),
      recursion:          this.detectRecursion(code, language),
      sorting:            this.detectSorting(code, language),
      binarySearch:       this._isBinarySearch(code.toLowerCase()),
      dynamicProgramming: this.detectDP(code),
      hashMap:            this.detectHashMap(code, language),
      arrays:             this.detectArrays(code, language),
    };
  }

  // ── Nested loop counter (brace-stack based) ──────────────────────────────────
  countNestedLoops(code, language) {
    const lines = code.split('\n');
    const isPython = language === 'python';
    if (isPython) return this._countNestedLoopsPython(lines);

    const loopRe = /\b(for|while)\s*[\(\s]/;
    const loopStack = [];
    let braceDepth = 0;
    let maxLoopDepth = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      const opens  = (trimmed.match(/\{/g) || []).length;
      const closes = (trimmed.match(/\}/g) || []).length;

      if (loopRe.test(trimmed)) {
        loopStack.push(braceDepth);
        maxLoopDepth = Math.max(maxLoopDepth, loopStack.length);
      }

      braceDepth += opens - closes;

      while (loopStack.length > 0 && braceDepth <= loopStack[loopStack.length - 1]) {
        loopStack.pop();
      }
    }

    return maxLoopDepth;
  }

  _countNestedLoopsPython(lines) {
    let maxDepth = 0;
    const loopRe = /^\s*(for |while )/;
    const indentStack = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      const indent = line.search(/\S/);

      while (indentStack.length > 0 && indentStack[indentStack.length - 1] >= indent) {
        indentStack.pop();
      }

      if (loopRe.test(line)) {
        indentStack.push(indent);
        maxDepth = Math.max(maxDepth, indentStack.length);
      }
    }

    return maxDepth;
  }

  detectRecursion(code, language) {
    const funcPattern = language === 'python'
      ? /def\s+(\w+)\s*\(/g
      : /(?:function\s+(\w+)|(\w+)\s*=\s*(?:function|\())/g;

    let match;
    while ((match = funcPattern.exec(code)) !== null) {
      const funcName = match[1] || match[2];
      if (!funcName) continue;
      const callPattern = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
      const calls = (code.match(callPattern) || []).length;
      if (calls >= 2) return true;
    }
    return false;
  }

  detectSorting(code, language) {
    const sortPatterns = {
      python:     ['.sort()', 'sorted(', 'heapq.'],
      javascript: ['.sort(', 'Array.prototype.sort'],
      cpp:        ['std::sort', 'sort(', 'stable_sort'],
      java:       ['Arrays.sort', 'Collections.sort'],
    };
    return (sortPatterns[language] || sortPatterns.javascript).some(p => code.includes(p));
  }

  detectDP(code) {
    return ['dp[', 'memo[', 'cache[', 'memoization', 'tabulation', '@lru_cache', '@cache']
      .some(p => code.toLowerCase().includes(p));
  }

  detectHashMap(code, language) {
    // JS: require purposeful map/set usage — NOT bare `{}` object literals
    const jsPatterns = [
      'new Map', 'new Set', 'Map()', 'Set()',
      'const map =', 'let map =', 'var map =',
      'const set =', 'let set =', 'var set =',
      'const hash', 'let hash', 'const freq', 'let freq',
    ];

    const langPatterns = {
      python:     ['dict(', 'defaultdict', 'Counter(', '= {}', '= dict()'],
      javascript: jsPatterns,
      cpp:        ['unordered_map', 'unordered_set', 'map<', 'set<'],
      java:       ['HashMap', 'HashSet', 'Map<', 'Set<'],
    };

    return (langPatterns[language] || jsPatterns).some(p => code.includes(p));
  }

  detectArrays(code, language) {
    const arrPatterns = {
      python:     ['= [', 'list(', 'array('],
      javascript: ['= []', 'new Array', 'Array.from', 'Array('],
      cpp:        ['vector<', 'int arr', 'int[]'],
      java:       ['ArrayList', 'List<', 'new int[', 'new long['],
    };
    return (arrPatterns[language] || arrPatterns.javascript).some(p => code.includes(p));
  }

  // ── Complexity estimation ────────────────────────────────────────────────────
  estimateTimeComplexity(patterns, algo) {
    if (algo.binarySearch)   return 'O(log n) — binary search';
    if (algo.divideConquer)  return 'O(n log n) — divide and conquer / merge sort';
    if (algo.mergeSorted)    return 'O(n + m) — linear merge of two sorted arrays';
    if (algo.twoPointer)     return 'O(n) — two-pointer technique';
    if (algo.slidingWindow)  return 'O(n) — sliding window';
    if (algo.twoSum)         return 'O(n) — hash-based single pass';

    if (patterns.recursion && patterns.nestedLoops >= 2) return 'O(2ⁿ) or worse — exponential recursion';
    if (patterns.nestedLoops >= 3) return 'O(n³) — triple nested loops';
    if (patterns.nestedLoops === 2) return 'O(n²) — quadratic (nested loops)';
    if (patterns.dynamicProgramming) return 'O(n²) or better — dynamic programming';
    if (patterns.sorting)    return 'O(n log n) — sorting-based';
    if (patterns.recursion)  return 'O(n) — linear recursion';
    if (patterns.nestedLoops === 1 || patterns.hashMap) return 'O(n) — linear scan';
    if (patterns.binarySearch) return 'O(log n) — binary search';

    return 'O(1) — constant time';
  }

  estimateSpaceComplexity(patterns, algo) {
    if (algo.mergeSorted && !patterns.arrays && !patterns.hashMap) return 'O(1) — in-place merge';
    if (algo.twoPointer  && !patterns.arrays && !patterns.hashMap) return 'O(1) — in-place two-pointer';

    if (patterns.dynamicProgramming) return 'O(n) — DP table';
    if (patterns.recursion)          return 'O(n) — call stack depth';
    if (patterns.hashMap)            return 'O(n) — hash map storage';
    if (patterns.arrays)             return 'O(n) — auxiliary array/list';

    return 'O(1) — constant extra space';
  }

  calculateConfidence(patterns, algo) {
    let confidence = 0.55;
    confidence += Object.values(patterns).filter(Boolean).length * 0.04;
    confidence += Object.values(algo).filter(Boolean).length     * 0.08;
    return Math.min(0.95, confidence);
  }

  removeComments(code, language) {
    if (language === 'python') {
      code = code.replace(/#.*$/gm, '');
      code = code.replace(/"""[\s\S]*?"""/g, '');
      code = code.replace(/'''[\s\S]*?'''/g, '');
    } else {
      code = code.replace(/\/\/.*$/gm, '');
      code = code.replace(/\/\*[\s\S]*?\*\//g, '');
    }
    return code;
  }
}

export default new ComplexityAnalyzer();