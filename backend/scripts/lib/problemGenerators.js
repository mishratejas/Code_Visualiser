/**
 * problemGenerators.js
 * ─────────────────────────────────────────────────────────────────────────
 * Generates a large, tag-diverse pool of coding problems for seeding.
 *
 * WHY THIS EXISTS:
 * The original seed (seedComplete.js) only ever created 20 problems across
 * 15 tags. That's why recommendations/learning-path felt thin — the AI
 * service pulls from "available_problems" and there just wasn't enough
 * (or varied-enough) data to recommend from, and several topics referenced
 * elsewhere in the app (trie, heap, sliding-window, bfs, dfs, matrix-dp,
 * bitmask-dp, knapsack, lcs, greedy...) had ZERO matching problems.
 *
 * Every generator below computes its own expected output with a real
 * reference implementation in JS at seed-time — so correctness doesn't
 * depend on hand-typing the right answer, and every test case is
 * guaranteed correct regardless of what language a student submits in.
 *
 * Each generator returns an array of problem variants (usually 2-3 per
 * template, different sizes/difficulty), so the pool multiplies out to
 * ~70-90 problems total when combined with the curated PROBLEMS array.
 */

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const randArray = (n, max = 100) => Array.from({ length: n }, () => randInt(-max, max));
const randSortedArray = (n, max = 100) => randArray(n, max).sort((a, b) => a - b);

function baseMeta(acceptanceRate) {
  const submissions = randInt(80, 1500);
  const accepted = Math.round(submissions * (acceptanceRate / 100));
  return {
    isPublished: true,
    acceptanceRate,
    submissions,
    acceptedSubmissions: accepted,
    views: randInt(200, 6000),
  };
}

// ── 1. Maximum element in array ─────────────────────────────────────────
function genArrayMax() {
  return [6, 10, 15].map((n, i) => {
    const arr = randArray(n, 500);
    const answer = Math.max(...arr);
    return {
      title: `Maximum Element in Array ${i > 0 ? `(v${i + 1})` : ''}`.trim(),
      difficulty: 'easy',
      tags: ['array', 'math'],
      description: `Given an array of **${n}** integers, find and print the maximum element.\n\n**Input:**\n- Line 1: n\n- Line 2: n space-separated integers\n\n**Output:** The maximum value`,
      inputFormat: 'n, then n integers', outputFormat: 'Single integer (max)',
      sampleInput: [`${n}\n${arr.join(' ')}`], sampleOutput: [`${answer}`],
      sampleExplanation: [`${answer} is the largest value in the array.`],
      testCases: [0, 1, 2].map(() => {
        const a = randArray(randInt(4, n + 5), 500);
        return { input: `${a.length}\n${a.join(' ')}`, expectedOutput: `${Math.max(...a)}`, isHidden: false };
      }).concat([3, 4].map(() => {
        const a = randArray(randInt(n + 5, n + 15), 1000);
        return { input: `${a.length}\n${a.join(' ')}`, expectedOutput: `${Math.max(...a)}`, isHidden: true };
      })),
      hints: [{ title: 'Linear Scan', content: 'Track the max seen so far in a single pass.', order: 1 }],
      constraints: { timeLimit: 1000, memoryLimit: 128 },
      metadata: baseMeta(randInt(75, 92)),
    };
  });
}

// ── 2. Sum of array elements ────────────────────────────────────────────
function genArraySum() {
  return [8, 12].map((n, i) => {
    const arr = randArray(n, 200);
    const answer = arr.reduce((a, b) => a + b, 0);
    return {
      title: `Sum of Array Elements ${i > 0 ? `(v${i + 1})` : ''}`.trim(),
      difficulty: 'easy',
      tags: ['array', 'math'],
      description: `Given an array of **${n}** integers, print the sum of all elements.\n\n**Input:**\n- Line 1: n\n- Line 2: n space-separated integers\n\n**Output:** The sum`,
      inputFormat: 'n, then n integers', outputFormat: 'Single integer (sum)',
      sampleInput: [`${n}\n${arr.join(' ')}`], sampleOutput: [`${answer}`],
      sampleExplanation: [`Sum of all ${n} elements is ${answer}.`],
      testCases: [0, 1, 2, 3].map((idx) => {
        const a = randArray(randInt(3, 20), 300);
        return { input: `${a.length}\n${a.join(' ')}`, expectedOutput: `${a.reduce((x, y) => x + y, 0)}`, isHidden: idx >= 2 };
      }),
      hints: [{ title: 'Accumulator', content: 'Iterate once, adding each value to a running total.', order: 1 }],
      constraints: { timeLimit: 1000, memoryLimit: 128 },
      metadata: baseMeta(randInt(80, 95)),
    };
  });
}

// ── 3. Palindrome string check ──────────────────────────────────────────
function genPalindromeCheck() {
  const words = [
    ['racecar', 'hello', 'level', 'world', 'madam', 'coding', 'noon', 'array'],
    ['refer', 'python', 'civic', 'stack', 'rotor', 'queue', 'kayak', 'graph'],
  ];
  return words.map((set, i) => ({
    title: `Palindrome String Check ${i > 0 ? `(v${i + 1})` : ''}`.trim(),
    difficulty: 'easy',
    tags: ['string', 'two-pointers'],
    description: `Given a string, determine whether it reads the same forwards and backwards.\n\n**Input:** A single line string\n**Output:** "true" or "false"`,
    inputFormat: 'A single string', outputFormat: '"true" or "false"',
    sampleInput: [set[0]], sampleOutput: [String(set[0] === [...set[0]].reverse().join(''))],
    sampleExplanation: ['Compare characters from both ends moving inward.'],
    testCases: set.map((w, idx) => ({
      input: w,
      expectedOutput: String(w === [...w].reverse().join('')),
      isHidden: idx >= set.length - 3,
    })),
    hints: [{ title: 'Two Pointers', content: 'Compare s[left] and s[right], moving inward until they meet.', order: 1 }],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: baseMeta(randInt(78, 90)),
  }));
}

// ── 4. Count vowels ──────────────────────────────────────────────────────
function genCountVowels() {
  const inputs = ['the quick brown fox', 'coding is fun and rewarding', 'dynamic programming rocks'];
  const count = (s) => (s.match(/[aeiou]/gi) || []).length;
  return [{
    title: 'Count Vowels in String',
    difficulty: 'easy',
    tags: ['string'],
    description: `Given a lowercase string (may contain spaces), count the number of vowels (a, e, i, o, u).\n\n**Input:** A single line string\n**Output:** Vowel count`,
    inputFormat: 'A string', outputFormat: 'Integer count',
    sampleInput: [inputs[0]], sampleOutput: [`${count(inputs[0])}`],
    sampleExplanation: [`"${inputs[0]}" contains ${count(inputs[0])} vowels.`],
    testCases: inputs.map((s, idx) => ({ input: s, expectedOutput: `${count(s)}`, isHidden: idx >= 1 })),
    hints: [{ title: 'Set Lookup', content: 'Check membership in {a,e,i,o,u} for each character.', order: 1 }],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: baseMeta(randInt(82, 94)),
  }];
}

// ── 5. GCD ────────────────────────────────────────────────────────────────
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function genGCD() {
  return [[48, 18], [1071, 462], [17, 5]].map(([a, b], i) => ({
    title: `Greatest Common Divisor ${i > 0 ? `(v${i + 1})` : ''}`.trim(),
    difficulty: 'easy',
    tags: ['math', 'recursion'],
    description: `Given two positive integers **a** and **b**, compute their GCD.\n\n**Input:** Two space-separated integers a, b\n**Output:** GCD(a, b)`,
    inputFormat: 'Two integers', outputFormat: 'GCD',
    sampleInput: [`${a} ${b}`], sampleOutput: [`${gcd(a, b)}`],
    sampleExplanation: [`GCD(${a}, ${b}) = ${gcd(a, b)}`],
    testCases: [[a, b], [100, 75], [7, 13], [360, 210], [1, 999]].map(([x, y], idx) => ({
      input: `${x} ${y}`, expectedOutput: `${gcd(x, y)}`, isHidden: idx >= 2,
    })),
    hints: [{ title: 'Euclidean Algorithm', content: 'GCD(a,b) = GCD(b, a mod b), base case b=0.', order: 1 }],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: baseMeta(randInt(80, 93)),
  }));
}

// ── 6. Power of two ──────────────────────────────────────────────────────
function genPowerOfTwo() {
  const isPow2 = (n) => n > 0 && (n & (n - 1)) === 0;
  return [{
    title: 'Power of Two',
    difficulty: 'easy',
    tags: ['math', 'bit-manipulation'],
    description: `Given an integer n, determine whether it is a power of two.\n\n**Input:** Integer n\n**Output:** "true" or "false"`,
    inputFormat: 'Single integer', outputFormat: '"true" or "false"',
    sampleInput: ['16'], sampleOutput: [String(isPow2(16))],
    sampleExplanation: ['16 = 2^4, so it is a power of two.'],
    testCases: [1, 2, 3, 64, 100, 1024, 0, 1000000].map((n, idx) => ({
      input: `${n}`, expectedOutput: String(isPow2(n)), isHidden: idx >= 5,
    })),
    hints: [{ title: 'Bit Trick', content: 'n is a power of two iff n > 0 and (n & (n-1)) == 0.', order: 1 }],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: baseMeta(randInt(70, 88)),
  }];
}

// ── 7. Count set bits ────────────────────────────────────────────────────
function popcount(n) { let c = 0; while (n) { c += n & 1; n >>>= 1; } return c; }
function genCountSetBits() {
  return [{
    title: 'Count Set Bits (Hamming Weight)',
    difficulty: 'medium',
    tags: ['bit-manipulation', 'math'],
    description: `Given a non-negative integer n, count the number of 1 bits in its binary representation.\n\n**Input:** Integer n\n**Output:** Count of set bits`,
    inputFormat: 'Single integer', outputFormat: 'Integer count',
    sampleInput: ['11'], sampleOutput: [`${popcount(11)}`],
    sampleExplanation: ['11 = 1011 in binary, which has 3 set bits.'],
    testCases: [0, 1, 7, 255, 1023, 123456].map((n, idx) => ({
      input: `${n}`, expectedOutput: `${popcount(n)}`, isHidden: idx >= 4,
    })),
    hints: [{ title: 'Brian Kernighan', content: 'Repeatedly do n = n & (n-1) to drop the lowest set bit.', order: 1 }],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: baseMeta(randInt(65, 85)),
  }];
}

// ── 8. Merge two sorted arrays ──────────────────────────────────────────
function genMergeSortedArrays() {
  return [6, 8].map((n, i) => {
    const a = randSortedArray(n, 100);
    const b = randSortedArray(n, 100);
    const merged = [...a, ...b].sort((x, y) => x - y);
    return {
      title: `Merge Two Sorted Arrays ${i > 0 ? `(v${i + 1})` : ''}`.trim(),
      difficulty: 'medium',
      tags: ['array', 'two-pointers', 'sorting'],
      description: `Given two sorted arrays, merge them into a single sorted array.\n\n**Input:**\n- Line 1: n, m\n- Line 2: n integers (array A, sorted)\n- Line 3: m integers (array B, sorted)\n\n**Output:** Merged sorted array, space-separated`,
      inputFormat: 'Two sorted arrays', outputFormat: 'Merged sorted array',
      sampleInput: [`${a.length} ${b.length}\n${a.join(' ')}\n${b.join(' ')}`],
      sampleOutput: [merged.join(' ')],
      sampleExplanation: ['Merge using two pointers, always taking the smaller front element.'],
      testCases: [0, 1, 2].map(() => {
        const x = randSortedArray(randInt(3, n), 200);
        const y = randSortedArray(randInt(3, n), 200);
        return {
          input: `${x.length} ${y.length}\n${x.join(' ')}\n${y.join(' ')}`,
          expectedOutput: [...x, ...y].sort((p, q) => p - q).join(' '),
          isHidden: false,
        };
      }),
      hints: [{ title: 'Two Pointers', content: 'Walk both arrays simultaneously, always emitting the smaller head.', order: 1 }],
      constraints: { timeLimit: 1500, memoryLimit: 128 },
      metadata: baseMeta(randInt(72, 88)),
    };
  });
}

// ── 9. Kadane's max subarray sum ─────────────────────────────────────────
function kadane(arr) {
  let best = arr[0], cur = arr[0];
  for (let i = 1; i < arr.length; i++) { cur = Math.max(arr[i], cur + arr[i]); best = Math.max(best, cur); }
  return best;
}
function genKadaneMaxSubarray() {
  return [8, 12].map((n, i) => {
    const arr = randArray(n, 50);
    return {
      title: `Maximum Subarray Sum ${i > 0 ? `(v${i + 1})` : ''}`.trim(),
      difficulty: 'medium',
      tags: ['array', 'dynamic-programming'],
      description: `Given an array of integers (may include negatives), find the maximum sum of any contiguous subarray.\n\n**Input:**\n- Line 1: n\n- Line 2: n integers\n\n**Output:** Maximum subarray sum`,
      inputFormat: 'n, then n integers', outputFormat: 'Integer',
      sampleInput: [`${n}\n${arr.join(' ')}`], sampleOutput: [`${kadane(arr)}`],
      sampleExplanation: ["Kadane's algorithm: extend or restart the running sum at each step."],
      testCases: [0, 1, 2, 3].map(() => {
        const a = randArray(randInt(5, 15), 60);
        return { input: `${a.length}\n${a.join(' ')}`, expectedOutput: `${kadane(a)}`, isHidden: true };
      }),
      hints: [{ title: "Kadane's Algorithm", content: 'dp[i] = max(arr[i], dp[i-1] + arr[i]); track the running max.', order: 1 }],
      constraints: { timeLimit: 1500, memoryLimit: 128 },
      metadata: baseMeta(randInt(60, 80)),
    };
  });
}

// ── 10. Longest Common Subsequence ──────────────────────────────────────
function lcsLen(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[a.length][b.length];
}
function genLCS() {
  const pairs = [['abcde', 'ace'], ['abcba', 'abcbcba'], ['programming', 'gaming']];
  return [{
    title: 'Longest Common Subsequence',
    difficulty: 'medium',
    tags: ['dynamic-programming', 'string', 'lcs'],
    description: `Given two strings, find the length of their longest common subsequence (not necessarily contiguous).\n\n**Input:** Two lines, one string each\n**Output:** Length of the LCS`,
    inputFormat: 'Two strings', outputFormat: 'Integer length',
    sampleInput: [`${pairs[0][0]}\n${pairs[0][1]}`], sampleOutput: [`${lcsLen(pairs[0][0], pairs[0][1])}`],
    sampleExplanation: ['"ace" is a subsequence of "abcde" — length 3.'],
    testCases: pairs.map(([a, b], idx) => ({
      input: `${a}\n${b}`, expectedOutput: `${lcsLen(a, b)}`, isHidden: idx >= 1,
    })),
    hints: [{ title: 'DP Table', content: 'dp[i][j] = dp[i-1][j-1]+1 if chars match, else max(dp[i-1][j], dp[i][j-1]).', order: 1 }],
    constraints: { timeLimit: 2000, memoryLimit: 256 },
    metadata: baseMeta(randInt(55, 75)),
  }];
}

// ── 11. 0/1 Knapsack ─────────────────────────────────────────────────────
function knapsack(weights, values, cap) {
  const n = weights.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(cap + 1).fill(0));
  for (let i = 1; i <= n; i++)
    for (let w = 0; w <= cap; w++)
      dp[i][w] = weights[i - 1] <= w
        ? Math.max(dp[i - 1][w], dp[i - 1][w - weights[i - 1]] + values[i - 1])
        : dp[i - 1][w];
  return dp[n][cap];
}
function genKnapsack() {
  const weights = [2, 3, 4, 5];
  const values = [3, 4, 5, 6];
  const cap = 5;
  return [{
    title: '0/1 Knapsack',
    difficulty: 'hard',
    tags: ['dynamic-programming', 'knapsack'],
    description: `Given item weights, values, and a knapsack capacity, find the maximum total value achievable without exceeding capacity (each item used at most once).\n\n**Input:**\n- Line 1: n, capacity\n- Line 2: n weights\n- Line 3: n values\n\n**Output:** Maximum achievable value`,
    inputFormat: 'n, capacity, weights, values', outputFormat: 'Integer',
    sampleInput: [`${weights.length} ${cap}\n${weights.join(' ')}\n${values.join(' ')}`],
    sampleOutput: [`${knapsack(weights, values, cap)}`],
    sampleExplanation: ['Classic 0/1 knapsack DP over (item, remaining capacity).'],
    testCases: [
      { w: [1, 3, 4, 5], v: [1, 4, 5, 7], cap: 7 },
      { w: [10, 20, 30], v: [60, 100, 120], cap: 50 },
      { w: weights, v: values, cap },
    ].map(({ w, v, cap: c }, idx) => ({
      input: `${w.length} ${c}\n${w.join(' ')}\n${v.join(' ')}`,
      expectedOutput: `${knapsack(w, v, c)}`,
      isHidden: idx >= 1,
    })),
    hints: [{ title: 'DP Table', content: 'dp[i][w] = best value using first i items with capacity w.', order: 1 }],
    constraints: { timeLimit: 2000, memoryLimit: 256 },
    metadata: baseMeta(randInt(45, 65)),
  }];
}

// ── 12. First and last occurrence (binary search) ──────────────────────
function genFirstLastOccurrence() {
  return [{
    title: 'First and Last Occurrence in Sorted Array',
    difficulty: 'medium',
    tags: ['binary-search', 'array'],
    description: `Given a sorted array (with duplicates) and a target, find the first and last index of target. Print "-1 -1" if not found.\n\n**Input:**\n- Line 1: n\n- Line 2: n sorted integers\n- Line 3: target\n\n**Output:** first_index last_index`,
    inputFormat: 'Sorted array + target', outputFormat: 'Two indices',
    sampleInput: ['6\n1 2 2 2 3 5\n2'], sampleOutput: ['1 3'],
    sampleExplanation: ['2 first appears at index 1 and last appears at index 3.'],
    testCases: [
      { arr: [1, 2, 2, 2, 3, 5], t: 2 },
      { arr: [5, 7, 7, 8, 8, 10], t: 8 },
      { arr: [1, 2, 3], t: 9 },
      { arr: [1], t: 1 },
    ].map(({ arr, t }, idx) => {
      const first = arr.indexOf(t);
      const last = arr.lastIndexOf(t);
      return { input: `${arr.length}\n${arr.join(' ')}\n${t}`, expectedOutput: `${first} ${last}`, isHidden: idx >= 2 };
    }),
    hints: [{ title: 'Two Binary Searches', content: 'Binary search for the leftmost and rightmost bound separately.', order: 1 }],
    constraints: { timeLimit: 1500, memoryLimit: 128 },
    metadata: baseMeta(randInt(60, 80)),
  }];
}

// ── 13. BFS shortest path in grid ───────────────────────────────────────
function bfsGrid(grid) {
  const rows = grid.length, cols = grid[0].length;
  const dist = Array.from({ length: rows }, () => new Array(cols).fill(-1));
  dist[0][0] = 0;
  const q = [[0, 0]];
  const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  while (q.length) {
    const [r, c] = q.shift();
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 0 && dist[nr][nc] === -1) {
        dist[nr][nc] = dist[r][c] + 1;
        q.push([nr, nc]);
      }
    }
  }
  return dist[rows - 1][cols - 1];
}
function genBFSGrid() {
  const grids = [
    [[0, 0, 0], [1, 1, 0], [0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 0, 1], [0, 0, 0, 1], [1, 1, 0, 0]],
  ];
  return grids.map((g, i) => ({
    title: `Shortest Path in Grid ${i > 0 ? `(v${i + 1})` : ''}`.trim(),
    difficulty: 'medium',
    tags: ['graph', 'bfs'],
    description: `Given a grid of 0s (open) and 1s (blocked), find the shortest path length (number of moves) from top-left to bottom-right, moving up/down/left/right. Print -1 if unreachable.\n\n**Input:**\n- Line 1: rows cols\n- Next rows lines: cols space-separated 0/1 values\n\n**Output:** Shortest path length or -1`,
    inputFormat: 'Grid dimensions + grid', outputFormat: 'Integer (path length or -1)',
    sampleInput: [`${g.length} ${g[0].length}\n${g.map(r => r.join(' ')).join('\n')}`],
    sampleOutput: [`${bfsGrid(g)}`],
    sampleExplanation: ['BFS explores cells in order of distance from the start.'],
    testCases: grids.map((grid, idx) => ({
      input: `${grid.length} ${grid[0].length}\n${grid.map(r => r.join(' ')).join('\n')}`,
      expectedOutput: `${bfsGrid(grid)}`,
      isHidden: idx >= 1,
    })).concat([{
      input: `2 2\n0 1\n1 0`,
      expectedOutput: `${bfsGrid([[0, 1], [1, 0]])}`,
      isHidden: true,
    }]),
    hints: [{ title: 'BFS', content: 'BFS guarantees shortest path in an unweighted grid — track distance level by level.', order: 1 }],
    constraints: { timeLimit: 2000, memoryLimit: 256 },
    metadata: baseMeta(randInt(55, 75)),
  }));
}

// ── 14. Count connected components (DFS) ────────────────────────────────
function countComponents(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  edges.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
  const seen = new Array(n).fill(false);
  let count = 0;
  for (let i = 0; i < n; i++) {
    if (!seen[i]) {
      count++;
      const stack = [i];
      seen[i] = true;
      while (stack.length) {
        const node = stack.pop();
        for (const nb of adj[node]) if (!seen[nb]) { seen[nb] = true; stack.push(nb); }
      }
    }
  }
  return count;
}
function genConnectedComponents() {
  return [{
    title: 'Count Connected Components',
    difficulty: 'medium',
    tags: ['graph', 'dfs'],
    description: `Given an undirected graph with n nodes (0-indexed) and a list of edges, count the number of connected components.\n\n**Input:**\n- Line 1: n, m (nodes, edges)\n- Next m lines: u v (an edge)\n\n**Output:** Number of connected components`,
    inputFormat: 'n, m, then m edges', outputFormat: 'Integer',
    sampleInput: ['5 3\n0 1\n1 2\n3 4'], sampleOutput: [`${countComponents(5, [[0, 1], [1, 2], [3, 4]])}`],
    sampleExplanation: ['{0,1,2} form one component, {3,4} form another — 2 total.'],
    testCases: [
      { n: 5, edges: [[0, 1], [1, 2], [3, 4]] },
      { n: 6, edges: [[0, 1], [2, 3], [4, 5], [0, 2]] },
      { n: 4, edges: [] },
      { n: 3, edges: [[0, 1], [1, 2], [0, 2]] },
    ].map(({ n, edges }, idx) => ({
      input: `${n} ${edges.length}\n${edges.map(e => e.join(' ')).join('\n')}`.trim(),
      expectedOutput: `${countComponents(n, edges)}`,
      isHidden: idx >= 2,
    })),
    hints: [{ title: 'DFS/Union-Find', content: 'DFS from every unvisited node; each DFS call covers one component.', order: 1 }],
    constraints: { timeLimit: 2000, memoryLimit: 256 },
    metadata: baseMeta(randInt(58, 78)),
  }];
}

// ── 15. Max sum subarray of size k (sliding window) ─────────────────────
function maxSumWindow(arr, k) {
  let sum = arr.slice(0, k).reduce((a, b) => a + b, 0);
  let best = sum;
  for (let i = k; i < arr.length; i++) { sum += arr[i] - arr[i - k]; best = Math.max(best, sum); }
  return best;
}
function genSlidingWindowMaxSum() {
  return [{
    title: 'Maximum Sum Subarray of Size K',
    difficulty: 'easy',
    tags: ['array', 'sliding-window'],
    description: `Given an array and an integer k, find the maximum sum of any contiguous subarray of exactly size k.\n\n**Input:**\n- Line 1: n, k\n- Line 2: n integers\n\n**Output:** Maximum window sum`,
    inputFormat: 'n, k, then n integers', outputFormat: 'Integer',
    sampleInput: ['8 3\n2 1 5 1 3 2 1 4'], sampleOutput: [`${maxSumWindow([2, 1, 5, 1, 3, 2, 1, 4], 3)}`],
    sampleExplanation: ['Slide a window of size 3, tracking the running sum.'],
    testCases: [
      { arr: [2, 1, 5, 1, 3, 2, 1, 4], k: 3 },
      { arr: [1, 4, 2, 10, 2, 3, 1, 0, 20], k: 4 },
      { arr: [5, 5, 5, 5], k: 2 },
    ].map(({ arr, k }, idx) => ({
      input: `${arr.length} ${k}\n${arr.join(' ')}`,
      expectedOutput: `${maxSumWindow(arr, k)}`,
      isHidden: idx >= 1,
    })),
    hints: [{ title: 'Sliding Window', content: 'Subtract the outgoing element, add the incoming one — avoid recomputing the whole sum.', order: 1 }],
    constraints: { timeLimit: 1500, memoryLimit: 128 },
    metadata: baseMeta(randInt(75, 90)),
  }];
}

// ── 16. Longest substring without repeating characters ──────────────────
function longestUniqueSubstr(s) {
  let start = 0, best = 0;
  const last = {};
  for (let i = 0; i < s.length; i++) {
    if (last[s[i]] !== undefined && last[s[i]] >= start) start = last[s[i]] + 1;
    last[s[i]] = i;
    best = Math.max(best, i - start + 1);
  }
  return best;
}
function genLongestUniqueSubstring() {
  const inputs = ['abcabcbb', 'bbbbb', 'pwwkew', 'dvdf'];
  return [{
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'medium',
    tags: ['string', 'sliding-window', 'hash-table'],
    description: `Given a string, find the length of the longest substring without repeating characters.\n\n**Input:** A single line string\n**Output:** Length of longest unique substring`,
    inputFormat: 'A string', outputFormat: 'Integer',
    sampleInput: [inputs[0]], sampleOutput: [`${longestUniqueSubstr(inputs[0])}`],
    sampleExplanation: ['"abc" is the longest substring with no repeats — length 3.'],
    testCases: inputs.map((s, idx) => ({ input: s, expectedOutput: `${longestUniqueSubstr(s)}`, isHidden: idx >= 2 })),
    hints: [{ title: 'Sliding Window + Hash Map', content: 'Track last-seen index of each char; shrink window when a repeat is found.', order: 1 }],
    constraints: { timeLimit: 1500, memoryLimit: 128 },
    metadata: baseMeta(randInt(58, 76)),
  }];
}

// ── 17. Kth largest element ──────────────────────────────────────────────
function genKthLargest() {
  return [{
    title: 'Kth Largest Element in Array',
    difficulty: 'medium',
    tags: ['heap', 'sorting', 'array'],
    description: `Given an array and an integer k, find the kth largest element (1-indexed, so k=1 means the largest).\n\n**Input:**\n- Line 1: n, k\n- Line 2: n integers\n\n**Output:** The kth largest value`,
    inputFormat: 'n, k, then n integers', outputFormat: 'Integer',
    sampleInput: ['6 2\n3 2 1 5 6 4'], sampleOutput: [`${[3, 2, 1, 5, 6, 4].sort((a, b) => b - a)[1]}`],
    sampleExplanation: ['Sorted descending: 6 5 4 3 2 1 — the 2nd largest is 5.'],
    testCases: [
      { arr: [3, 2, 1, 5, 6, 4], k: 2 },
      { arr: [3, 2, 3, 1, 2, 4, 5, 5, 6], k: 4 },
      { arr: [1], k: 1 },
      { arr: randArray(12, 100), k: randInt(1, 12) },
    ].map(({ arr, k }, idx) => ({
      input: `${arr.length} ${k}\n${arr.join(' ')}`,
      expectedOutput: `${[...arr].sort((a, b) => b - a)[k - 1]}`,
      isHidden: idx >= 2,
    })),
    hints: [{ title: 'Min-Heap of size K', content: 'Maintain a min-heap of size k; the root is the kth largest.', order: 1 }],
    constraints: { timeLimit: 1500, memoryLimit: 128 },
    metadata: baseMeta(randInt(62, 82)),
  }];
}

// ── 18. Unique paths with obstacles (matrix DP) ─────────────────────────
function uniquePaths(grid) {
  const rows = grid.length, cols = grid[0].length;
  const dp = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) { dp[r][c] = 0; continue; }
      if (r === 0 && c === 0) { dp[r][c] = 1; continue; }
      dp[r][c] = (r > 0 ? dp[r - 1][c] : 0) + (c > 0 ? dp[r][c - 1] : 0);
    }
  return dp[rows - 1][cols - 1];
}
function genUniquePaths() {
  const grids = [
    [[0, 0, 0], [0, 1, 0], [0, 0, 0]],
    [[0, 1], [0, 0]],
  ];
  return [{
    title: 'Unique Paths with Obstacles',
    difficulty: 'medium',
    tags: ['dynamic-programming', 'matrix-dp'],
    description: `A robot starts at the top-left of a grid and wants to reach the bottom-right, moving only right or down. Cells marked 1 are obstacles. Count the number of distinct paths.\n\n**Input:**\n- Line 1: rows cols\n- Next rows lines: cols 0/1 values\n\n**Output:** Number of unique paths`,
    inputFormat: 'Grid with obstacles', outputFormat: 'Integer',
    sampleInput: [`${grids[0].length} ${grids[0][0].length}\n${grids[0].map(r => r.join(' ')).join('\n')}`],
    sampleOutput: [`${uniquePaths(grids[0])}`],
    sampleExplanation: ['DP: paths(r,c) = paths(r-1,c) + paths(r,c-1), 0 if obstacle.'],
    testCases: grids.map((g, idx) => ({
      input: `${g.length} ${g[0].length}\n${g.map(r => r.join(' ')).join('\n')}`,
      expectedOutput: `${uniquePaths(g)}`,
      isHidden: idx >= 1,
    })).concat([{
      input: '3 3\n0 0 0\n0 0 0\n0 0 0',
      expectedOutput: `${uniquePaths([[0, 0, 0], [0, 0, 0], [0, 0, 0]])}`,
      isHidden: true,
    }]),
    hints: [{ title: 'Matrix DP', content: 'Build a DP grid where each cell sums the ways from above and from the left.', order: 1 }],
    constraints: { timeLimit: 2000, memoryLimit: 256 },
    metadata: baseMeta(randInt(55, 74)),
  }];
}

// ── 19. Activity selection (greedy) ─────────────────────────────────────
function activitySelection(activities) {
  const sorted = [...activities].sort((a, b) => a[1] - b[1]);
  let count = 0, lastEnd = -Infinity;
  for (const [s, e] of sorted) if (s >= lastEnd) { count++; lastEnd = e; }
  return count;
}
function genActivitySelection() {
  return [{
    title: 'Activity Selection Problem',
    difficulty: 'medium',
    tags: ['greedy', 'sorting'],
    description: `Given n activities with start and end times, select the maximum number of non-overlapping activities.\n\n**Input:**\n- Line 1: n\n- Next n lines: start end\n\n**Output:** Maximum number of activities that can be selected`,
    inputFormat: 'n, then n (start, end) pairs', outputFormat: 'Integer',
    sampleInput: ['4\n1 2\n3 4\n0 6\n5 7'], sampleOutput: [`${activitySelection([[1, 2], [3, 4], [0, 6], [5, 7]])}`],
    sampleExplanation: ['Sort by end time, greedily pick activities that start after the last pick ends.'],
    testCases: [
      [[1, 2], [3, 4], [0, 6], [5, 7]],
      [[1, 4], [3, 5], [0, 6], [5, 7], [3, 9], [5, 9], [6, 10], [8, 11], [8, 12], [2, 14], [12, 16]],
      [[1, 2], [2, 3], [3, 4]],
    ].map((activities, idx) => ({
      input: `${activities.length}\n${activities.map(a => a.join(' ')).join('\n')}`,
      expectedOutput: `${activitySelection(activities)}`,
      isHidden: idx >= 1,
    })),
    hints: [{ title: 'Greedy by End Time', content: 'Always greedily pick the activity that finishes earliest among remaining valid ones.', order: 1 }],
    constraints: { timeLimit: 1500, memoryLimit: 128 },
    metadata: baseMeta(randInt(60, 80)),
  }];
}

// ── 20. Fast exponentiation ─────────────────────────────────────────────
function fastPow(base, exp, mod) {
  let result = 1n; base = BigInt(base) % BigInt(mod); exp = BigInt(exp); const m = BigInt(mod);
  while (exp > 0n) { if (exp % 2n === 1n) result = (result * base) % m; base = (base * base) % m; exp /= 2n; }
  return result.toString();
}
function genFastExponentiation() {
  const MOD = 1000000007;
  return [{
    title: 'Power Function (Fast Exponentiation)',
    difficulty: 'easy',
    tags: ['recursion', 'math'],
    description: `Compute (base^exp) mod ${MOD} efficiently using fast exponentiation.\n\n**Input:** Two integers base, exp\n**Output:** (base^exp) mod ${MOD}`,
    inputFormat: 'base, exp', outputFormat: 'Integer result',
    sampleInput: ['2 10'], sampleOutput: [fastPow(2, 10, MOD)],
    sampleExplanation: ['2^10 = 1024, and 1024 mod 1e9+7 = 1024.'],
    testCases: [[2, 10], [3, 15], [5, 100], [7, 1000], [2, 0]].map(([b, e], idx) => ({
      input: `${b} ${e}`, expectedOutput: fastPow(b, e, MOD), isHidden: idx >= 2,
    })),
    hints: [{ title: 'Divide and Conquer', content: 'x^n = (x^(n/2))^2, halving exp at each recursive step — O(log n).', order: 1 }],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: baseMeta(randInt(68, 85)),
  }];
}

// ── 21. Word search with prefix (trie-flavoured) ────────────────────────
function genWordPrefixSearch() {
  const words = ['code', 'coder', 'coding', 'cat', 'car', 'care', 'dog', 'do'];
  return [{
    title: 'Count Words With Given Prefix',
    difficulty: 'medium',
    tags: ['trie', 'string'],
    description: `Given a dictionary of n words and a query prefix, count how many words start with that prefix. (This is the core operation a Trie is built to answer in O(prefix length).)\n\n**Input:**\n- Line 1: n\n- Line 2: n space-separated words\n- Line 3: query prefix\n\n**Output:** Count of words with that prefix`,
    inputFormat: 'n words + a prefix query', outputFormat: 'Integer count',
    sampleInput: [`${words.length}\n${words.join(' ')}\nco`],
    sampleOutput: [`${words.filter(w => w.startsWith('co')).length}`],
    sampleExplanation: ['"code", "coder", "coding" all start with "co" — count is 3.'],
    testCases: ['co', 'car', 'do', 'z', 'c'].map((prefix, idx) => ({
      input: `${words.length}\n${words.join(' ')}\n${prefix}`,
      expectedOutput: `${words.filter(w => w.startsWith(prefix)).length}`,
      isHidden: idx >= 2,
    })),
    hints: [{ title: 'Trie Traversal', content: 'A trie lets you walk down prefix characters once, then count all words in that subtree.', order: 1 }],
    constraints: { timeLimit: 1500, memoryLimit: 128 },
    metadata: baseMeta(randInt(58, 76)),
  }];
}

// ── 22. Minimum cost to visit all cities (bitmask DP / TSP, small n) ────
function tsp(dist) {
  const n = dist.length;
  const FULL = (1 << n) - 1;
  const dp = Array.from({ length: 1 << n }, () => new Array(n).fill(Infinity));
  dp[1][0] = 0;
  for (let mask = 1; mask <= FULL; mask++) {
    for (let u = 0; u < n; u++) {
      if (!(mask & (1 << u)) || dp[mask][u] === Infinity) continue;
      for (let v = 0; v < n; v++) {
        if (mask & (1 << v)) continue;
        const next = mask | (1 << v);
        dp[next][v] = Math.min(dp[next][v], dp[mask][u] + dist[u][v]);
      }
    }
  }
  let best = Infinity;
  for (let u = 1; u < n; u++) if (dp[FULL][u] !== Infinity) best = Math.min(best, dp[FULL][u] + dist[u][0]);
  return best;
}
function genTSPBitmask() {
  const dist4 = [[0, 10, 15, 20], [10, 0, 35, 25], [15, 35, 0, 30], [20, 25, 30, 0]];
  return [{
    title: 'Minimum Cost to Visit All Cities (TSP)',
    difficulty: 'hard',
    tags: ['bitmask-dp', 'dynamic-programming', 'graph'],
    description: `Given the distance matrix between n cities (n ≤ 12), find the minimum cost of a round trip starting and ending at city 0, visiting every city exactly once.\n\n**Input:**\n- Line 1: n\n- Next n lines: n integers (distance matrix row)\n\n**Output:** Minimum tour cost`,
    inputFormat: 'n x n distance matrix', outputFormat: 'Integer (minimum cost)',
    sampleInput: [`4\n${dist4.map(r => r.join(' ')).join('\n')}`], sampleOutput: [`${tsp(dist4)}`],
    sampleExplanation: ['Bitmask DP: dp[visited_set][last_city] = min cost to reach this state.'],
    testCases: [
      dist4,
      [[0, 5, 9, 10], [5, 0, 6, 4], [9, 6, 0, 3], [10, 4, 3, 0]],
    ].map((d, idx) => ({
      input: `${d.length}\n${d.map(r => r.join(' ')).join('\n')}`,
      expectedOutput: `${tsp(d)}`,
      isHidden: idx >= 1,
    })),
    hints: [{ title: 'Bitmask State', content: 'State = (set of visited cities, current city). Transition by adding one unvisited city at a time.', order: 1 }],
    constraints: { timeLimit: 3000, memoryLimit: 256 },
    metadata: baseMeta(randInt(35, 55)),
  }];
}

// ── 23. Merge overlapping intervals ──────────────────────────────────────
function mergeIntervals(intervals) {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [s, e] of sorted) {
    if (out.length && s <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], e);
    else out.push([s, e]);
  }
  return out;
}
function genMergeIntervals() {
  return [{
    title: 'Merge Overlapping Intervals',
    difficulty: 'medium',
    tags: ['array', 'sorting', 'intervals'],
    description: `Given a list of intervals, merge all overlapping intervals and print the result sorted by start time.\n\n**Input:**\n- Line 1: n\n- Next n lines: start end\n\n**Output:** Merged intervals, one per line, as "start end"`,
    inputFormat: 'n intervals', outputFormat: 'Merged intervals',
    sampleInput: ['4\n1 3\n2 6\n8 10\n15 18'],
    sampleOutput: [mergeIntervals([[1, 3], [2, 6], [8, 10], [15, 18]]).map(i => i.join(' ')).join('\n')],
    sampleExplanation: ['[1,3] and [2,6] overlap and merge into [1,6].'],
    testCases: [
      [[1, 3], [2, 6], [8, 10], [15, 18]],
      [[1, 4], [4, 5]],
      [[1, 4], [0, 4]],
    ].map((intervals, idx) => ({
      input: `${intervals.length}\n${intervals.map(i => i.join(' ')).join('\n')}`,
      expectedOutput: mergeIntervals(intervals).map(i => i.join(' ')).join('\n'),
      isHidden: idx >= 1,
    })),
    hints: [{ title: 'Sort then Sweep', content: 'Sort by start; merge into the last output interval whenever it overlaps.', order: 1 }],
    constraints: { timeLimit: 1500, memoryLimit: 128 },
    metadata: baseMeta(randInt(62, 82)),
  }];
}

// ── 24. Validate BST from level-order array ──────────────────────────────
function isValidBSTArray(levelOrder) {
  // levelOrder uses null for missing children; rebuild tree then validate range property
  function build(i) {
    if (i >= levelOrder.length || levelOrder[i] === null) return null;
    return { val: levelOrder[i], left: build(2 * i + 1), right: build(2 * i + 2) };
  }
  const root = build(0);
  function valid(node, lo, hi) {
    if (!node) return true;
    if (node.val <= lo || node.val >= hi) return false;
    return valid(node.left, lo, node.val) && valid(node.right, node.val, hi);
  }
  return valid(root, -Infinity, Infinity);
}
function genValidBST() {
  const trees = [
    [2, 1, 3],
    [5, 1, 4, null, null, 3, 6],
    [10, 5, 15, null, null, 6, 20],
  ];
  return [{
    title: 'Validate Binary Search Tree',
    difficulty: 'medium',
    tags: ['tree', 'binary-search-tree', 'recursion'],
    description: `Given a binary tree in level-order (array form, "null" for missing nodes), determine if it is a valid Binary Search Tree.\n\n**Input:**\n- Line 1: n\n- Line 2: n tokens, integers or the literal "null"\n\n**Output:** "true" or "false"`,
    inputFormat: 'Level-order array (tokens or "null")', outputFormat: '"true" or "false"',
    sampleInput: ['3\n2 1 3'], sampleOutput: [String(isValidBSTArray([2, 1, 3]))],
    sampleExplanation: ['Root=2, left=1 (<2), right=3 (>2) — valid BST.'],
    testCases: trees.map((t, idx) => ({
      input: `${t.length}\n${t.map(v => (v === null ? 'null' : v)).join(' ')}`,
      expectedOutput: String(isValidBSTArray(t)),
      isHidden: idx >= 1,
    })),
    hints: [{ title: 'Range Validation', content: 'Recursively check each node falls within an allowed (lo, hi) range, narrowing as you descend.', order: 1 }],
    constraints: { timeLimit: 1500, memoryLimit: 128 },
    metadata: baseMeta(randInt(55, 74)),
  }];
}

// ── 25. Factorial via recursion ─────────────────────────────────────────
function factorial(n) { return n <= 1 ? 1n : BigInt(n) * factorial(n - 1); }
function genFactorial() {
  return [{
    title: 'Factorial Using Recursion',
    difficulty: 'easy',
    tags: ['recursion', 'math'],
    description: `Compute n! (n factorial) using recursion.\n\n**Input:** Integer n (0 ≤ n ≤ 20)\n**Output:** n!`,
    inputFormat: 'Single integer', outputFormat: 'n! as an integer',
    sampleInput: ['5'], sampleOutput: [factorial(5).toString()],
    sampleExplanation: ['5! = 5×4×3×2×1 = 120'],
    testCases: [0, 1, 5, 10, 15, 20].map((n, idx) => ({
      input: `${n}`, expectedOutput: factorial(n).toString(), isHidden: idx >= 3,
    })),
    hints: [{ title: 'Base Case', content: 'factorial(0) = factorial(1) = 1; otherwise n * factorial(n-1).', order: 1 }],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: baseMeta(randInt(85, 96)),
  }];
}

/**
 * Runs every generator and flattens the results into one array.
 * Titles are de-duplicated defensively (adds a numeric suffix on collision)
 * since slugs must be unique in the Problem collection.
 */
export function generateProblemPool() {
  const generators = [
    genArrayMax, genArraySum, genPalindromeCheck, genCountVowels, genGCD,
    genPowerOfTwo, genCountSetBits, genMergeSortedArrays, genKadaneMaxSubarray,
    genLCS, genKnapsack, genFirstLastOccurrence, genBFSGrid, genConnectedComponents,
    genSlidingWindowMaxSum, genLongestUniqueSubstring, genKthLargest, genUniquePaths,
    genActivitySelection, genFastExponentiation, genWordPrefixSearch, genTSPBitmask,
    genMergeIntervals, genValidBST, genFactorial,
  ];

  const pool = [];
  const seenTitles = new Set();
  for (const gen of generators) {
    for (const problem of gen()) {
      let title = problem.title;
      let n = 2;
      while (seenTitles.has(title)) { title = `${problem.title} #${n++}`; }
      seenTitles.add(title);
      pool.push({ ...problem, title });
    }
  }
  return pool;
}

export { randInt, rand, shuffle };