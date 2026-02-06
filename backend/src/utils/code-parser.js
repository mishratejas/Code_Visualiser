/**
 * Parse and extract information from code
 */
class CodeParser {
  /**
   * Extract function names from code
   */
  extractFunctions(code, language) {
    const functions = [];
    
    const patterns = {
      python: /def\s+(\w+)\s*\(/g,
      javascript: /function\s+(\w+)\s*\(|const\s+(\w+)\s*=\s*\([^\)]*\)\s*=>/g,
      cpp: /\w+\s+(\w+)\s*\([^\)]*\)\s*\{/g,
      java: /(public|private|protected|static|\s)+[\w\<\>\[\]]+\s+(\w+)\s*\([^\)]*\)\s*\{/g
    };

    const pattern = patterns[language];
    if (!pattern) return functions;

    let match;
    while ((match = pattern.exec(code)) !== null) {
      const funcName = match[1] || match[2];
      if (funcName && funcName !== 'if' && funcName !== 'for' && funcName !== 'while') {
        functions.push({
          name: funcName,
          lineNumber: code.substring(0, match.index).split('\n').length
        });
      }
    }

    return functions;
  }

  /**
   * Extract class names from code
   */
  extractClasses(code, language) {
    const classes = [];
    
    const patterns = {
      python: /class\s+(\w+)/g,
      javascript: /class\s+(\w+)/g,
      cpp: /class\s+(\w+)/g,
      java: /class\s+(\w+)/g
    };

    const pattern = patterns[language];
    if (!pattern) return classes;

    let match;
    while ((match = pattern.exec(code)) !== null) {
      classes.push({
        name: match[1],
        lineNumber: code.substring(0, match.index).split('\n').length
      });
    }

    return classes;
  }

  /**
   * Count loops in code
   */
  countLoops(code, language) {
    const loopPatterns = {
      python: /(for\s+\w+\s+in|while\s+)/g,
      javascript: /(for\s*\(|while\s*\()/g,
      cpp: /(for\s*\(|while\s*\()/g,
      java: /(for\s*\(|while\s*\()/g
    };

    const pattern = loopPatterns[language];
    if (!pattern) return 0;

    const matches = code.match(pattern);
    return matches ? matches.length : 0;
  }

  /**
   * Count conditionals in code
   */
  countConditionals(code, language) {
    const conditionalPatterns = {
      python: /(if\s+|elif\s+)/g,
      javascript: /(if\s*\()/g,
      cpp: /(if\s*\()/g,
      java: /(if\s*\()/g
    };

    const pattern = conditionalPatterns[language];
    if (!pattern) return 0;

    const matches = code.match(pattern);
    return matches ? matches.length : 0;
  }

  /**
   * Detect imports/includes
   */
  extractImports(code, language) {
    const imports = [];
    
    const patterns = {
      python: /^(?:import|from)\s+(\S+)/gm,
      javascript: /^import\s+.*from\s+['"](\S+)['"]/gm,
      cpp: /#include\s*[<"](\S+)[>"]/g,
      java: /^import\s+(\S+);/gm
    };

    const pattern = patterns[language];
    if (!pattern) return imports;

    let match;
    while ((match = pattern.exec(code)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * Calculate cyclomatic complexity (simplified)
   */
  calculateComplexity(code, language) {
    let complexity = 1; // Start with 1

    // Count decision points
    complexity += this.countConditionals(code, language);
    complexity += this.countLoops(code, language);

    // Count logical operators
    const logicalOps = code.match(/(\&\&|\|\||and|or)/g);
    if (logicalOps) complexity += logicalOps.length;

    // Count case statements
    const cases = code.match(/\bcase\b/g);
    if (cases) complexity += cases.length;

    return complexity;
  }

  /**
   * Remove comments from code
   */
  removeComments(code, language) {
    if (language === 'python') {
      // Remove # comments
      code = code.replace(/#.*$/gm, '');
      // Remove """ docstrings """
      code = code.replace(/"""[\s\S]*?"""/g, '');
      // Remove ''' docstrings '''
      code = code.replace(/'''[\s\S]*?'''/g, '');
    } else {
      // Remove // comments
      code = code.replace(/\/\/.*$/gm, '');
      // Remove /* */ comments
      code = code.replace(/\/\*[\s\S]*?\*\//g, '');
    }

    return code;
  }

  /**
   * Tokenize code into meaningful tokens
   */
  tokenize(code, language) {
    // Remove comments
    code = this.removeComments(code, language);

    // Split by various delimiters
    const tokens = code
      .split(/[\s\(\)\{\}\[\];,\.]+/)
      .filter(token => token.length > 0)
      .filter(token => !/^\d+$/.test(token)); // Remove pure numbers

    return tokens;
  }
}

export default new CodeParser();