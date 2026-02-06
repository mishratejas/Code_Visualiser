import featureExtractor from '../utils/feature-extractor.js';
import complexityAnalyzer from '../utils/complexity-analyzer.js';
import logger from '../config/logger.js';

class CodeAnalysisService {
  /**
   * Perform local code analysis (without AI service)
   */
  async analyzeLocally(code, language) {
    try {
      // Extract features
      const features = await featureExtractor.extract(code, language);

      // Analyze complexity
      const complexity = await complexityAnalyzer.analyze(code, language);

      // Detect anti-patterns
      const antiPatterns = this.detectAntiPatterns(code, language);

      return {
        features,
        complexity,
        antiPatterns,
        linesOfCode: this.countLines(code),
        characterCount: code.length
      };
    } catch (error) {
      logger.error('Local code analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Detect common anti-patterns
   */
  detectAntiPatterns(code, language) {
    const patterns = [];

    // Nested loops (potential O(n²) or worse)
    const nestedLoops = this.detectNestedLoops(code, language);
    if (nestedLoops > 2) {
      patterns.push({
        type: 'deeply_nested_loops',
        severity: 'high',
        description: `Found ${nestedLoops} levels of nested loops`,
        suggestion: 'Consider using a more efficient algorithm'
      });
    }

    // Long functions
    const lines = code.split('\n').length;
    if (lines > 100) {
      patterns.push({
        type: 'long_function',
        severity: 'medium',
        description: 'Function is too long',
        suggestion: 'Break into smaller, focused functions'
      });
    }

    // Magic numbers
    if (language !== 'python') {
      const magicNumbers = code.match(/\b\d{4,}\b/g);
      if (magicNumbers && magicNumbers.length > 3) {
        patterns.push({
          type: 'magic_numbers',
          severity: 'low',
          description: 'Multiple magic numbers found',
          suggestion: 'Use named constants instead'
        });
      }
    }

    return patterns;
  }

  /**
   * Detect nested loops
   */
  detectNestedLoops(code, language) {
    let maxNesting = 0;
    let currentNesting = 0;

    const loopKeywords = {
      python: ['for ', 'while '],
      cpp: ['for(', 'for ', 'while(', 'while '],
      java: ['for(', 'for ', 'while(', 'while '],
      javascript: ['for(', 'for ', 'while(', 'while ']
    };

    const keywords = loopKeywords[language] || loopKeywords.javascript;
    const lines = code.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      
      for (const keyword of keywords) {
        if (trimmed.startsWith(keyword)) {
          currentNesting++;
          maxNesting = Math.max(maxNesting, currentNesting);
        }
      }

      // Decrease nesting on closing braces (simplified)
      if (trimmed === '}' || (language === 'python' && line.length < 4)) {
        currentNesting = Math.max(0, currentNesting - 1);
      }
    }

    return maxNesting;
  }

  /**
   * Count lines of code (excluding comments and empty lines)
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
   * Calculate code quality score (0-100)
   */
  calculateQualityScore(analysis) {
    let score = 100;

    // Deduct for anti-patterns
    analysis.antiPatterns.forEach(pattern => {
      if (pattern.severity === 'high') score -= 15;
      else if (pattern.severity === 'medium') score -= 10;
      else score -= 5;
    });

    // Deduct for poor complexity
    if (analysis.complexity.time.includes('n³')) score -= 20;
    else if (analysis.complexity.time.includes('n²')) score -= 15;
    else if (analysis.complexity.time.includes('2^n')) score -= 30;

    // Deduct for excessive length
    if (analysis.linesOfCode > 200) score -= 10;
    else if (analysis.linesOfCode > 100) score -= 5;

    return Math.max(0, Math.min(100, score));
  }
}

export default new CodeAnalysisService();