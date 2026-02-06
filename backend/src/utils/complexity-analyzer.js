/**
 * Analyze time and space complexity of code
 */
class ComplexityAnalyzer {
  /**
   * Analyze code complexity
   */
  async analyze(code, language) {
    // Remove comments for better analysis
    const cleanCode = this.removeComments(code, language);

    // Detect patterns
    const patterns = this.detectPatterns(cleanCode, language);

    // Estimate complexity
    const timeComplexity = this.estimateTimeComplexity(patterns);
    const spaceComplexity = this.estimateSpaceComplexity(patterns);

    return {
      time: timeComplexity,
      space: spaceComplexity,
      patterns,
      confidence: this.calculateConfidence(patterns)
    };
  }

  /**
   * Detect algorithmic patterns
   */
  detectPatterns(code, language) {
    const patterns = {
      nestedLoops: this.countNestedLoops(code, language),
      recursion: this.detectRecursion(code, language),
      sorting: this.detectSorting(code, language),
      binarySearch: this.detectBinarySearch(code),
      dynamicProgramming: this.detectDP(code, language),
      hashMap: this.detectHashMap(code, language),
      arrays: this.detectArrays(code, language)
    };

    return patterns;
  }

  /**
   * Count nested loops
   */
  countNestedLoops(code, language) {
    const lines = code.split('\n');
    let maxNesting = 0;
    let currentNesting = 0;
    
    const loopKeywords = {
      python: ['for ', 'while '],
      javascript: ['for(', 'for ', 'while(', 'while '],
      cpp: ['for(', 'for ', 'while(', 'while '],
      java: ['for(', 'for ', 'while(', 'while ']
    };

    const keywords = loopKeywords[language] || loopKeywords.javascript;

    for (const line of lines) {
      const trimmed = line.trim();
      
      for (const keyword of keywords) {
        if (trimmed.startsWith(keyword) || trimmed.includes(' ' + keyword)) {
          currentNesting++;
          maxNesting = Math.max(maxNesting, currentNesting);
        }
      }

      if (trimmed === '}' || (language === 'python' && line.match(/^\s{0,3}\S/))) {
        currentNesting = Math.max(0, currentNesting - 1);
      }
    }

    return maxNesting;
  }

  /**
   * Detect recursion
   */
  detectRecursion(code, language) {
    // Look for function calling itself
    const funcPattern = language === 'python' 
      ? /def\s+(\w+)/g
      : /function\s+(\w+)/g;

    const functions = [];
    let match;
    
    while ((match = funcPattern.exec(code)) !== null) {
      const funcName = match[1];
      // Check if function calls itself
      const callPattern = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
      const calls = code.match(callPattern);
      if (calls && calls.length > 1) {
        functions.push(funcName);
      }
    }

    return functions.length > 0;
  }

  /**
   * Detect sorting
   */
  detectSorting(code, language) {
    const sortPatterns = {
      python: ['.sort()', 'sorted(', 'heapq.'],
      javascript: ['.sort('],
      cpp: ['std::sort', 'sort('],
      java: ['Arrays.sort', 'Collections.sort']
    };

    const patterns = sortPatterns[language] || sortPatterns.javascript;
    return patterns.some(pattern => code.includes(pattern));
  }

  /**
   * Detect binary search
   */
  detectBinarySearch(code) {
    const bsPatterns = [
      'mid =',
      'middle =',
      'left <= right',
      'low <= high',
      'binary_search',
      'binarySearch'
    ];

    let matches = 0;
    for (const pattern of bsPatterns) {
      if (code.includes(pattern)) matches++;
    }

    return matches >= 2; // Need at least 2 indicators
  }

  /**
   * Detect dynamic programming
   */
  detectDP(code, language) {
    const dpPatterns = [
      'dp[',
      'memo[',
      'cache[',
      'memoization',
      'tabulation'
    ];

    return dpPatterns.some(pattern => code.toLowerCase().includes(pattern));
  }

  /**
   * Detect hash map usage
   */
  detectHashMap(code, language) {
    const hashPatterns = {
      python: ['dict(', '{', 'defaultdict', 'Counter'],
      javascript: ['Map(', 'Set(', 'new Map', 'new Set', '{}'],
      cpp: ['unordered_map', 'unordered_set', 'map<', 'set<'],
      java: ['HashMap', 'HashSet', 'Map<', 'Set<']
    };

    const patterns = hashPatterns[language] || hashPatterns.javascript;
    return patterns.some(pattern => code.includes(pattern));
  }

  /**
   * Detect array/list usage
   */
  detectArrays(code, language) {
    const arrayPatterns = {
      python: ['[', 'list(', 'array'],
      javascript: ['[]', 'Array(', 'new Array'],
      cpp: ['vector', 'array', '[]'],
      java: ['ArrayList', 'List<', '[]']
    };

    const patterns = arrayPatterns[language] || arrayPatterns.javascript;
    return patterns.some(pattern => code.includes(pattern));
  }

  /**
   * Estimate time complexity
   */
  estimateTimeComplexity(patterns) {
    // Exponential/Factorial
    if (patterns.recursion && patterns.nestedLoops >= 2) {
      return 'O(2^n) or worse';
    }

    // Cubic or higher
    if (patterns.nestedLoops >= 3) {
      return 'O(n³) or O(n⁴)';
    }

    // Quadratic
    if (patterns.nestedLoops === 2) {
      return 'O(n²)';
    }

    // Linearithmic
    if (patterns.sorting || (patterns.recursion && patterns.binarySearch)) {
      return 'O(n log n)';
    }

    // Linear
    if (patterns.nestedLoops === 1 || patterns.arrays || patterns.hashMap) {
      return 'O(n)';
    }

    // Logarithmic
    if (patterns.binarySearch && !patterns.nestedLoops) {
      return 'O(log n)';
    }

    // Constant
    return 'O(1)';
  }

  /**
   * Estimate space complexity
   */
  estimateSpaceComplexity(patterns) {
    if (patterns.dynamicProgramming) {
      return 'O(n) or O(n²)';
    }

    if (patterns.recursion) {
      return 'O(n) due to recursion stack';
    }

    if (patterns.hashMap || patterns.arrays) {
      return 'O(n)';
    }

    return 'O(1)';
  }

  /**
   * Calculate confidence in the analysis
   */
  calculateConfidence(patterns) {
    let confidence = 0.5; // Base confidence

    // Increase confidence with more patterns detected
    const detectedPatterns = Object.values(patterns).filter(Boolean).length;
    confidence += detectedPatterns * 0.05;

    // Cap at 0.95
    return Math.min(0.95, confidence);
  }

  /**
   * Remove comments
   */
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