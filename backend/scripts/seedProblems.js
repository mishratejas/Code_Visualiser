/**
 * CodeForge — Problems-only Seed
 * Drops all existing problems and re-creates 20 high-quality ones.
 * Does NOT touch users or submissions.
 * Usage: node scripts/seedProblems.js
 */

import mongoose from 'mongoose';
import Problem from '../src/models/problem.models.js';
import User from '../src/models/user.models.js';
import dotenv from 'dotenv';
import readline from 'readline';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codeforge';

const ask = (q) => new Promise(resolve => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(q, a => { rl.close(); resolve(a.trim().toLowerCase()); });
});

const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ─────────────────────────────────────────────────────────────────────────────
//  All tags validated against: array, string, linked-list, tree, graph,
//  dynamic-programming, backtracking, greedy, binary-search, two-pointers,
//  stack, queue, heap, hash-table, math, bit-manipulation, sorting,
//  recursion, divide-and-conquer
// ─────────────────────────────────────────────────────────────────────────────
const PROBLEMS = [

  // ════════════ EASY (7) ════════════

  {
    title: 'Two Sum',
    difficulty: 'easy',
    tags: ['array', 'hash-table'],
    description: `Given an array of integers **nums** and an integer **target**, return the **indices** of the two numbers that add up to **target**. You may assume exactly one solution exists and you may not use the same element twice. Output the smaller index first.

**Input**
- Line 1: n
- Line 2: n space-separated integers
- Line 3: target

**Output**
Two space-separated indices (smaller first).`,
    inputFormat: 'n integers on one line, target on next line',
    outputFormat: 'Two indices separated by a space',
    sampleInput: ['4\n2 7 11 15\n9'],
    sampleOutput: ['0 1'],
    sampleExplanation: ['nums[0] + nums[1] = 2 + 7 = 9'],
    testCases: [
      { input: '4\n2 7 11 15\n9',  expectedOutput: '0 1', isHidden: false },
      { input: '3\n3 2 4\n6',      expectedOutput: '1 2', isHidden: false },
      { input: '2\n3 3\n6',        expectedOutput: '0 1', isHidden: true  },
      { input: '5\n1 5 3 7 8\n10', expectedOutput: '1 3', isHidden: true  },
      { input: '6\n0 4 3 0 5 2\n0',expectedOutput: '0 3', isHidden: true  },
    ],
    hints: [
      { title: 'Brute Force O(n²)', content: 'Check every pair. Too slow but correct.', order: 1 },
      { title: 'HashMap O(n)', content: 'For each number, check if (target - num) is already in a map. Store seen numbers as you go.', order: 2 },
    ],
    constraints: { timeLimit: 2000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 72, submissions: 1240, acceptedSubmissions: 893, views: 4500 },
  },

  {
    title: 'Valid Parentheses',
    difficulty: 'easy',
    tags: ['string', 'stack'],
    description: `Determine if a string of brackets is **valid**. A string is valid when:
- Open brackets are closed by the same type of bracket.
- Open brackets are closed in the correct order.
- Every close bracket has a matching open bracket.

**Input** — A single bracket string (only characters: \`(){}[]\`)
**Output** — \`true\` or \`false\``,
    inputFormat: 'A single string of bracket characters',
    outputFormat: 'true or false',
    sampleInput: ['()[]{}'],
    sampleOutput: ['true'],
    sampleExplanation: ['Every bracket has a matching close bracket in the right order'],
    testCases: [
      { input: '()[]{}', expectedOutput: 'true',  isHidden: false },
      { input: '([)]',   expectedOutput: 'false', isHidden: false },
      { input: '{[]}',   expectedOutput: 'true',  isHidden: true  },
      { input: '((((',   expectedOutput: 'false', isHidden: true  },
      { input: '()',     expectedOutput: 'true',  isHidden: true  },
    ],
    hints: [
      { title: 'Stack', content: 'Push every open bracket. When you see a close bracket, check if the top of the stack is the matching open.', order: 1 },
    ],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: { isPublished: true, acceptanceRate: 68, submissions: 980, acceptedSubmissions: 666, views: 3800 },
  },

  {
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'easy',
    tags: ['array', 'dynamic-programming', 'greedy'],
    description: `Given an array where \`prices[i]\` is the price of a stock on day \`i\`, find the **maximum profit** you can achieve by buying once and selling once (you must buy before you sell). Return 0 if no profit is possible.

**Input**
- Line 1: n
- Line 2: n space-separated prices

**Output** — Maximum profit (integer)`,
    inputFormat: 'Array size then prices',
    outputFormat: 'Maximum profit',
    sampleInput: ['6\n7 1 5 3 6 4'],
    sampleOutput: ['5'],
    sampleExplanation: ['Buy at 1 (day 2), sell at 6 (day 5). Profit = 5'],
    testCases: [
      { input: '6\n7 1 5 3 6 4', expectedOutput: '5', isHidden: false },
      { input: '5\n7 6 4 3 1',   expectedOutput: '0', isHidden: false },
      { input: '2\n1 2',         expectedOutput: '1', isHidden: true  },
      { input: '4\n3 3 3 3',     expectedOutput: '0', isHidden: true  },
      { input: '5\n1 2 10 3 7',  expectedOutput: '9', isHidden: true  },
    ],
    hints: [
      { title: 'Track Minimum', content: 'Scan left to right. Track the minimum price seen so far. At each day, profit = current - min. Track max profit seen.', order: 1 },
    ],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: { isPublished: true, acceptanceRate: 76, submissions: 1420, acceptedSubmissions: 1079, views: 5200 },
  },

  {
    title: 'Palindrome Number',
    difficulty: 'easy',
    tags: ['math'],
    description: `Determine whether an integer is a **palindrome** (reads the same forwards and backwards). Negative numbers are never palindromes.

**Input** — A single integer x
**Output** — \`true\` or \`false\``,
    inputFormat: 'Single integer x',
    outputFormat: 'true or false',
    sampleInput: ['121'],
    sampleOutput: ['true'],
    sampleExplanation: ['121 reads as 121 from left to right and from right to left'],
    testCases: [
      { input: '121',   expectedOutput: 'true',  isHidden: false },
      { input: '-121',  expectedOutput: 'false', isHidden: false },
      { input: '10',    expectedOutput: 'false', isHidden: true  },
      { input: '0',     expectedOutput: 'true',  isHidden: true  },
      { input: '12321', expectedOutput: 'true',  isHidden: true  },
    ],
    hints: [
      { title: 'No strings needed', content: 'Reverse only the second half of the number mathematically and compare with the first half.', order: 1 },
    ],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: { isPublished: true, acceptanceRate: 80, submissions: 870, acceptedSubmissions: 696, views: 3100 },
  },

  {
    title: 'Binary Search',
    difficulty: 'easy',
    tags: ['array', 'binary-search'],
    description: `Given a sorted array of distinct integers and a target, return its **index**. If not found, return **-1**. Your solution must run in **O(log n)**.

**Input**
- Line 1: n
- Line 2: n sorted integers
- Line 3: target

**Output** — Index or -1`,
    inputFormat: 'Sorted array with size, then target',
    outputFormat: 'Index or -1',
    sampleInput: ['6\n1 3 5 7 9 11\n7'],
    sampleOutput: ['3'],
    sampleExplanation: ['7 is at index 3 (0-indexed)'],
    testCases: [
      { input: '6\n1 3 5 7 9 11\n7', expectedOutput: '3',  isHidden: false },
      { input: '5\n2 4 6 8 10\n5',   expectedOutput: '-1', isHidden: false },
      { input: '4\n1 2 3 4\n1',      expectedOutput: '0',  isHidden: true  },
      { input: '4\n1 2 3 4\n4',      expectedOutput: '3',  isHidden: true  },
      { input: '1\n42\n42',          expectedOutput: '0',  isHidden: true  },
    ],
    hints: [
      { title: 'Two Pointers', content: 'Maintain left and right. Compute mid = (left + right) / 2. Compare nums[mid] with target and eliminate half the range.', order: 1 },
    ],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: { isPublished: true, acceptanceRate: 74, submissions: 1100, acceptedSubmissions: 814, views: 4000 },
  },

  {
    title: 'Longest Common Prefix',
    difficulty: 'easy',
    tags: ['string'],
    description: `Find the **longest common prefix** string among an array of strings. Output \`NONE\` if there is no common prefix.

**Input**
- Line 1: n
- Next n lines: one string each

**Output** — Common prefix string or NONE`,
    inputFormat: 'n strings one per line',
    outputFormat: 'Common prefix or NONE',
    sampleInput: ['3\nflower\nflow\nflight'],
    sampleOutput: ['fl'],
    sampleExplanation: ['"fl" is the longest prefix shared by all three strings'],
    testCases: [
      { input: '3\nflower\nflow\nflight', expectedOutput: 'fl',    isHidden: false },
      { input: '3\ndog\nracecar\ncar',    expectedOutput: 'NONE', isHidden: false },
      { input: '2\nabc\nabc',            expectedOutput: 'abc',  isHidden: true  },
      { input: '1\nhello',              expectedOutput: 'hello', isHidden: true  },
      { input: '3\na\nab\nabc',         expectedOutput: 'a',    isHidden: true  },
    ],
    hints: [
      { title: 'Horizontal Scan', content: 'Take the first string as the prefix. For each subsequent string, shrink the prefix until it matches the start of that string.', order: 1 },
    ],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: { isPublished: true, acceptanceRate: 65, submissions: 830, acceptedSubmissions: 540, views: 3100 },
  },

  {
    title: 'Missing Number',
    difficulty: 'easy',
    tags: ['array', 'math', 'bit-manipulation'],
    description: `Given an array containing **n distinct numbers** in range [0, n], find the one number that is missing.

**Input**
- Line 1: n
- Line 2: n space-separated integers

**Output** — The missing number`,
    inputFormat: 'n then n distinct numbers from [0,n]',
    outputFormat: 'The missing number',
    sampleInput: ['4\n3 0 1 4'],
    sampleOutput: ['2'],
    sampleExplanation: ['The range is [0,4]. 2 is missing.'],
    testCases: [
      { input: '4\n3 0 1 4',   expectedOutput: '2', isHidden: false },
      { input: '3\n0 1 2',     expectedOutput: '3', isHidden: false },
      { input: '1\n1',         expectedOutput: '0', isHidden: true  },
      { input: '5\n5 3 1 4 2', expectedOutput: '0', isHidden: true  },
    ],
    hints: [
      { title: 'Gauss Formula', content: 'Expected sum = n*(n+1)/2. Subtract actual sum. The difference is the missing number.', order: 1 },
      { title: 'XOR approach', content: 'XOR all indices 0..n with all array values. Missing number remains.', order: 2 },
    ],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: { isPublished: true, acceptanceRate: 82, submissions: 690, acceptedSubmissions: 566, views: 2600 },
  },

  // ════════════ MEDIUM (8) ════════════

  {
    title: 'Maximum Subarray',
    difficulty: 'medium',
    tags: ['array', 'dynamic-programming', 'divide-and-conquer'],
    description: `Find the **contiguous subarray** (containing at least one element) with the **largest sum** and return its sum.

**Input**
- Line 1: n
- Line 2: n integers (may include negatives)

**Output** — Maximum subarray sum`,
    inputFormat: 'Array size then elements',
    outputFormat: 'Maximum sum',
    sampleInput: ['9\n-2 1 -3 4 -1 2 1 -5 4'],
    sampleOutput: ['6'],
    sampleExplanation: ['Subarray [4, -1, 2, 1] has the largest sum = 6'],
    testCases: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6',  isHidden: false },
      { input: '1\n1',                      expectedOutput: '1',  isHidden: false },
      { input: '5\n-1 -2 -3 -4 -5',        expectedOutput: '-1', isHidden: true  },
      { input: '4\n1 2 3 4',               expectedOutput: '10', isHidden: true  },
      { input: '5\n5 -3 5 -3 5',           expectedOutput: '9',  isHidden: true  },
    ],
    hints: [
      { title: "Kadane's Algorithm", content: "Scan left to right. Keep a 'current sum'. If current sum drops below 0, reset it to 0. Track the maximum current sum seen.", order: 1 },
    ],
    constraints: { timeLimit: 2000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 58, submissions: 1520, acceptedSubmissions: 882, views: 5500 },
  },

  {
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'medium',
    tags: ['string', 'two-pointers', 'hash-table'],
    description: `Find the **length** of the longest substring that contains no repeating characters.

**Input** — A single string s (may be empty)
**Output** — Length (integer)`,
    inputFormat: 'A string',
    outputFormat: 'Length integer',
    sampleInput: ['abcabcbb'],
    sampleOutput: ['3'],
    sampleExplanation: ['"abc" is the longest substring without repeats'],
    testCases: [
      { input: 'abcabcbb', expectedOutput: '3', isHidden: false },
      { input: 'bbbbb',    expectedOutput: '1', isHidden: false },
      { input: 'pwwkew',   expectedOutput: '3', isHidden: true  },
      { input: 'a',        expectedOutput: '1', isHidden: true  },
      { input: 'dvdf',     expectedOutput: '3', isHidden: true  },
    ],
    hints: [
      { title: 'Sliding Window', content: 'Use a set and two pointers (left, right). Expand right. When duplicate found, shrink from left until no duplicate. Track max window size.', order: 1 },
    ],
    constraints: { timeLimit: 2000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 44, submissions: 1890, acceptedSubmissions: 832, views: 6800 },
  },

  {
    title: 'Container With Most Water',
    difficulty: 'medium',
    tags: ['array', 'two-pointers', 'greedy'],
    description: `You have n vertical lines on the x-axis. Line i has height \`height[i]\`. Find two lines that together with the x-axis form a container holding the **most water**. Area = min(h[i], h[j]) × (j - i).

**Input**
- Line 1: n
- Line 2: n heights

**Output** — Maximum area`,
    inputFormat: 'Heights array with size',
    outputFormat: 'Maximum water area',
    sampleInput: ['9\n1 8 6 2 5 4 8 3 7'],
    sampleOutput: ['49'],
    sampleExplanation: ['Lines at index 1 (h=8) and 8 (h=7): min(8,7) × 7 = 49'],
    testCases: [
      { input: '9\n1 8 6 2 5 4 8 3 7', expectedOutput: '49', isHidden: false },
      { input: '2\n1 1',               expectedOutput: '1',  isHidden: false },
      { input: '4\n4 3 2 1',           expectedOutput: '4',  isHidden: true  },
      { input: '3\n1 2 1',             expectedOutput: '2',  isHidden: true  },
      { input: '6\n2 3 4 5 18 17',     expectedOutput: '17', isHidden: true  },
    ],
    hints: [
      { title: 'Two Pointers', content: 'Start with left=0, right=n-1. The area is limited by the shorter line, so move the pointer at the shorter line inward. This can only improve area.', order: 1 },
    ],
    constraints: { timeLimit: 2000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 41, submissions: 1460, acceptedSubmissions: 599, views: 5300 },
  },

  {
    title: 'Coin Change',
    difficulty: 'medium',
    tags: ['dynamic-programming', 'graph'],
    description: `Find the **minimum number of coins** needed to make up the given amount. Return **-1** if it's impossible.

**Input**
- Line 1: n (number of coin denominations)
- Line 2: n coin values
- Line 3: target amount

**Output** — Minimum coins or -1`,
    inputFormat: 'Coin count, then denominations, then amount',
    outputFormat: 'Minimum coins or -1',
    sampleInput: ['3\n1 5 6\n11'],
    sampleOutput: ['2'],
    sampleExplanation: ['Coins 5 + 6 = 11, using just 2 coins'],
    testCases: [
      { input: '3\n1 5 6\n11',   expectedOutput: '2',  isHidden: false },
      { input: '3\n1 2 5\n11',   expectedOutput: '3',  isHidden: false },
      { input: '1\n2\n3',        expectedOutput: '-1', isHidden: true  },
      { input: '3\n1 5 10\n100', expectedOutput: '10', isHidden: true  },
      { input: '2\n3 7\n0',      expectedOutput: '0',  isHidden: true  },
    ],
    hints: [
      { title: 'Bottom-up DP', content: 'Create dp[0..amount], set dp[0]=0, rest=Infinity. For each amount i, try each coin: dp[i] = min(dp[i], dp[i-coin]+1).', order: 1 },
    ],
    constraints: { timeLimit: 3000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 42, submissions: 1680, acceptedSubmissions: 706, views: 6100 },
  },

  {
    title: '3Sum',
    difficulty: 'medium',
    tags: ['array', 'two-pointers', 'sorting'],
    description: `Find all **unique triplets** in the array that sum to **zero**. The solution set must not contain duplicate triplets.

**Input**
- Line 1: n
- Line 2: n integers

**Output** — Each triplet (sorted ascending) on its own line, result set sorted lexicographically. Output \`NONE\` if no triplets exist.`,
    inputFormat: 'Array size then elements',
    outputFormat: 'Triplets one per line or NONE',
    sampleInput: ['6\n-1 0 1 2 -1 -4'],
    sampleOutput: ['-1 -1 2\n-1 0 1'],
    sampleExplanation: ['Two unique triplets both summing to 0'],
    testCases: [
      { input: '6\n-1 0 1 2 -1 -4', expectedOutput: '-1 -1 2\n-1 0 1', isHidden: false },
      { input: '3\n0 0 0',          expectedOutput: '0 0 0',           isHidden: false },
      { input: '3\n1 2 3',          expectedOutput: 'NONE',            isHidden: true  },
      { input: '6\n-4 -1 -1 0 1 2', expectedOutput: '-1 -1 2\n-1 0 1',isHidden: true  },
    ],
    hints: [
      { title: 'Sort first', content: 'Sorting makes it easy to skip duplicates and use two pointers.', order: 1 },
      { title: 'Fix + Two Pointer', content: 'Fix nums[i], use two pointers l=i+1 and r=n-1 to find the pair that sums to -nums[i].', order: 2 },
    ],
    constraints: { timeLimit: 3000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 36, submissions: 2100, acceptedSubmissions: 756, views: 7600 },
  },

  {
    title: 'Climbing Stairs',
    difficulty: 'medium',
    tags: ['math', 'dynamic-programming'],
    description: `You can climb 1 or 2 steps at a time. How many **distinct ways** can you reach the top of n stairs?

**Input** — Integer n (1 ≤ n ≤ 45)
**Output** — Number of distinct ways`,
    inputFormat: 'Single integer n',
    outputFormat: 'Number of distinct ways',
    sampleInput: ['5'],
    sampleOutput: ['8'],
    sampleExplanation: ['1+1+1+1+1, 1+1+1+2, 1+1+2+1, 1+2+1+1, 2+1+1+1, 2+2+1, 2+1+2, 1+2+2 = 8 ways'],
    testCases: [
      { input: '1',  expectedOutput: '1',        isHidden: false },
      { input: '5',  expectedOutput: '8',        isHidden: false },
      { input: '10', expectedOutput: '89',       isHidden: true  },
      { input: '35', expectedOutput: '14930352', isHidden: true  },
      { input: '45', expectedOutput: '1836311903', isHidden: true },
    ],
    hints: [
      { title: 'It is Fibonacci', content: 'ways(n) = ways(n-1) + ways(n-2). Use two variables instead of an array.', order: 1 },
    ],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: { isPublished: true, acceptanceRate: 62, submissions: 1340, acceptedSubmissions: 831, views: 4900 },
  },

  {
    title: 'Product of Array Except Self',
    difficulty: 'medium',
    tags: ['array'],
    description: `Return an array \`output\` where \`output[i]\` is the product of all elements in \`nums\` except \`nums[i]\`. Solve in **O(n)** without using division.

**Input**
- Line 1: n
- Line 2: n integers

**Output** — n space-separated products`,
    inputFormat: 'Array size then elements',
    outputFormat: 'Space-separated product array',
    sampleInput: ['4\n1 2 3 4'],
    sampleOutput: ['24 12 8 6'],
    sampleExplanation: ['output[0]=2×3×4=24, output[1]=1×3×4=12, etc.'],
    testCases: [
      { input: '4\n1 2 3 4',   expectedOutput: '24 12 8 6', isHidden: false },
      { input: '3\n2 3 4',     expectedOutput: '12 8 6',    isHidden: false },
      { input: '4\n-1 1 0 -3', expectedOutput: '0 0 3 0',  isHidden: true  },
      { input: '2\n5 10',      expectedOutput: '10 5',      isHidden: true  },
    ],
    hints: [
      { title: 'Prefix × Suffix', content: 'Build left[i] = product of all elements left of i. Build right[i] = product of all right of i. Answer = left[i] × right[i].', order: 1 },
    ],
    constraints: { timeLimit: 2000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 48, submissions: 980, acceptedSubmissions: 471, views: 3600 },
  },

  {
    title: 'Word Search',
    difficulty: 'medium',
    tags: ['array', 'backtracking'],
    description: `Given an m×n grid of characters and a target word, return \`true\` if the word exists in the grid. The word must be formed by horizontally or vertically adjacent cells. Each cell can only be used once per path.

**Input**
- Line 1: m n
- Next m lines: space-separated characters
- Last line: the word to find

**Output** — \`true\` or \`false\``,
    inputFormat: 'Grid then word',
    outputFormat: 'true or false',
    sampleInput: ['3 4\nA B C E\nS F C S\nA D E E\nABCCED'],
    sampleOutput: ['true'],
    sampleExplanation: ['A→B→C→C→E→D traces a valid path'],
    testCases: [
      { input: '3 4\nA B C E\nS F C S\nA D E E\nABCCED', expectedOutput: 'true',  isHidden: false },
      { input: '3 4\nA B C E\nS F C S\nA D E E\nABCB',   expectedOutput: 'false', isHidden: false },
      { input: '3 4\nA B C E\nS F C S\nA D E E\nSEE',    expectedOutput: 'true',  isHidden: true  },
      { input: '1 1\nA\nA',                              expectedOutput: 'true',  isHidden: true  },
    ],
    hints: [
      { title: 'DFS + Backtrack', content: 'Try every cell as a starting point. For each step, go in 4 directions. Mark current cell as visited, recurse, then unmark (backtrack).', order: 1 },
    ],
    constraints: { timeLimit: 4000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 34, submissions: 1320, acceptedSubmissions: 449, views: 4800 },
  },

  // ════════════ HARD (5) ════════════

  {
    title: 'Trapping Rain Water',
    difficulty: 'hard',
    tags: ['array', 'two-pointers', 'dynamic-programming', 'stack'],
    description: `Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much **water** can be trapped after raining.

**Input**
- Line 1: n
- Line 2: n heights

**Output** — Total water trapped (integer)`,
    inputFormat: 'Heights array with size',
    outputFormat: 'Water units',
    sampleInput: ['12\n0 1 0 2 1 0 1 3 2 1 2 1'],
    sampleOutput: ['6'],
    sampleExplanation: ['6 units of water are trapped in the valleys between bars'],
    testCases: [
      { input: '12\n0 1 0 2 1 0 1 3 2 1 2 1', expectedOutput: '6', isHidden: false },
      { input: '6\n4 2 0 3 2 5',              expectedOutput: '9', isHidden: false },
      { input: '3\n3 0 3',                    expectedOutput: '3', isHidden: true  },
      { input: '1\n5',                        expectedOutput: '0', isHidden: true  },
      { input: '5\n1 0 1 0 1',               expectedOutput: '2', isHidden: true  },
    ],
    hints: [
      { title: 'Precompute Maxes', content: 'Water at index i = min(maxLeft[i], maxRight[i]) - height[i]. Build two arrays in O(n).', order: 1 },
      { title: 'Two Pointer (O(1) space)', content: 'Track maxLeft and maxRight as you move two pointers inward. Move whichever pointer has the smaller max.', order: 2 },
    ],
    constraints: { timeLimit: 3000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 30, submissions: 1950, acceptedSubmissions: 585, views: 7200 },
  },

  {
    title: 'Median of Two Sorted Arrays',
    difficulty: 'hard',
    tags: ['array', 'binary-search', 'divide-and-conquer'],
    description: `Given two **sorted** arrays nums1 (size m) and nums2 (size n), find the **median** of the combined sorted array. Required time complexity: **O(log(m+n))**.

**Input**
- Line 1: m
- Line 2: m sorted integers (or empty line if m=0)
- Line 3: n
- Line 4: n sorted integers

**Output** — Median with exactly 1 decimal place`,
    inputFormat: 'Two sorted arrays with sizes',
    outputFormat: 'Median (1 decimal place)',
    sampleInput: ['2\n1 3\n1\n2'],
    sampleOutput: ['2.0'],
    sampleExplanation: ['Merged: [1, 2, 3]. Median = 2.0'],
    testCases: [
      { input: '2\n1 3\n1\n2',   expectedOutput: '2.0', isHidden: false },
      { input: '2\n1 2\n2\n3 4', expectedOutput: '2.5', isHidden: false },
      { input: '1\n1\n1\n2',     expectedOutput: '1.5', isHidden: true  },
      { input: '0\n0\n1\n1',     expectedOutput: '1.0', isHidden: true  },
    ],
    hints: [
      { title: 'Binary Search Partition', content: 'Binary search on the smaller array. Find the partition where left half of combined array ≤ right half.', order: 1 },
    ],
    constraints: { timeLimit: 3000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 22, submissions: 1100, acceptedSubmissions: 242, views: 6400 },
  },

  {
    title: 'N-Queens',
    difficulty: 'hard',
    tags: ['backtracking', 'recursion'],
    description: `Count the number of distinct solutions for placing **n non-attacking queens** on an n×n chessboard. Queens attack along rows, columns, and diagonals.

**Input** — Integer n (1 ≤ n ≤ 9)
**Output** — Number of valid solutions`,
    inputFormat: 'Single integer n',
    outputFormat: 'Number of solutions',
    sampleInput: ['4'],
    sampleOutput: ['2'],
    sampleExplanation: ['There are exactly 2 ways to place 4 queens on a 4×4 board without attacking each other'],
    testCases: [
      { input: '1', expectedOutput: '1',   isHidden: false },
      { input: '4', expectedOutput: '2',   isHidden: false },
      { input: '6', expectedOutput: '4',   isHidden: true  },
      { input: '8', expectedOutput: '92',  isHidden: true  },
      { input: '9', expectedOutput: '352', isHidden: true  },
    ],
    hints: [
      { title: 'One queen per row', content: 'Place queens row by row. For each row, try every column. If no conflict (column, main diagonal, anti-diagonal), recurse to next row.', order: 1 },
      { title: 'Track conflicts', content: 'Use three boolean sets: columns, diagonals (row-col), anti-diagonals (row+col).', order: 2 },
    ],
    constraints: { timeLimit: 5000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 18, submissions: 760, acceptedSubmissions: 137, views: 4300 },
  },

  {
    title: 'LRU Cache',
    difficulty: 'hard',
    tags: ['hash-table', 'linked-list'],
    description: `Design a data structure implementing a **Least Recently Used (LRU) Cache** with O(1) get and put operations.

Process commands:
- \`SET key value\` — Insert or update. Evict LRU if at capacity.
- \`GET key\` → Print value or \`-1\` if not present.
- \`END\` → Stop.

Both GET and SET count as "recent use".

**Input** — Line 1 = capacity, then commands
**Output** — Results of each GET, one per line`,
    inputFormat: 'Capacity then SET/GET/END commands',
    outputFormat: 'GET results one per line',
    sampleInput: ['3\nSET 1 1\nSET 2 2\nGET 1\nSET 3 3\nGET 2\nEND'],
    sampleOutput: ['1\n-1'],
    sampleExplanation: ['GET 1 returns 1. After SET 3, key 2 (LRU) is evicted. GET 2 returns -1.'],
    testCases: [
      { input: '3\nSET 1 1\nSET 2 2\nGET 1\nSET 3 3\nGET 2\nEND',
        expectedOutput: '1\n-1', isHidden: false },
      { input: '2\nSET 1 10\nSET 2 20\nGET 1\nSET 3 30\nGET 2\nGET 3\nEND',
        expectedOutput: '10\n-1\n30', isHidden: false },
      { input: '1\nSET 1 5\nGET 1\nSET 2 10\nGET 1\nGET 2\nEND',
        expectedOutput: '5\n-1\n10', isHidden: true },
    ],
    hints: [
      { title: 'HashMap + Doubly Linked List', content: 'HashMap for O(1) key lookup. Doubly linked list for O(1) move-to-front and tail eviction.', order: 1 },
    ],
    constraints: { timeLimit: 5000, memoryLimit: 512 },
    metadata: { isPublished: true, acceptanceRate: 25, submissions: 890, acceptedSubmissions: 223, views: 5200 },
  },

  {
    title: 'Regular Expression Matching',
    difficulty: 'hard',
    tags: ['string', 'dynamic-programming', 'recursion'],
    description: `Implement regex matching supporting two special characters:
- \`.\` — Matches any single character
- \`*\` — Matches **zero or more** of the preceding element

The matching must cover the **entire** input string.

**Input**
- Line 1: string s
- Line 2: pattern p

**Output** — \`true\` or \`false\``,
    inputFormat: 'String then pattern on separate lines',
    outputFormat: 'true or false',
    sampleInput: ['aa\na*'],
    sampleOutput: ['true'],
    sampleExplanation: ['"a*" means zero-or-more "a", which fully matches "aa"'],
    testCases: [
      { input: 'aa\na*',  expectedOutput: 'true',  isHidden: false },
      { input: 'ab\n.*', expectedOutput: 'true',  isHidden: false },
      { input: 'mississippi\nmis*is*p*.', expectedOutput: 'false', isHidden: true },
      { input: 'aab\nc*a*b', expectedOutput: 'true', isHidden: true },
      { input: 'aaa\na*a', expectedOutput: 'true', isHidden: true },
    ],
    hints: [
      { title: '2D DP', content: 'dp[i][j] = does s[0..i-1] fully match p[0..j-1]? Base: dp[0][0]=true.', order: 1 },
      { title: 'Star cases', content: 'If p[j-1]=="*": dp[i][j] = dp[i][j-2] (0 matches) OR (p[j-2] matches s[i-1] AND dp[i-1][j]).', order: 2 },
    ],
    constraints: { timeLimit: 3000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 15, submissions: 920, acceptedSubmissions: 138, views: 5800 },
  },

];

// ─────────────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n📚 CodeForge — Problems Seed');
  console.log('════════════════════════════════════════');
  console.log(`   ${PROBLEMS.filter(p=>p.difficulty==='easy').length} Easy  |  ${PROBLEMS.filter(p=>p.difficulty==='medium').length} Medium  |  ${PROBLEMS.filter(p=>p.difficulty==='hard').length} Hard`);

  const ans = await ask('\n⚠️  This will DROP all existing problems. Type "yes" to continue: ');
  if (ans !== 'yes') { console.log('❌ Aborted.'); process.exit(0); }

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    console.error('❌ No admin user found. Run the full seed first (node scripts/seedComplete.js).');
    process.exit(1);
  }

  await Problem.deleteMany({});
  console.log('🗑️  Old problems cleared');

  const results = [];
  for (const p of PROBLEMS) {
    const created = await Problem.create({
      title:             p.title,
      slug:              slug(p.title),
      description:       p.description,
      difficulty:        p.difficulty,
      tags:              p.tags,
      inputFormat:       p.inputFormat,
      outputFormat:      p.outputFormat,
      sampleInput:       p.sampleInput,
      sampleOutput:      p.sampleOutput,
      sampleExplanation: p.sampleExplanation,
      testCases:         p.testCases,
      hints:             p.hints,
      constraints:       p.constraints,
      metadata:          p.metadata,
      createdBy:         admin._id,
    });
    results.push(created);
    console.log(`  ✓ [${p.difficulty.padEnd(6)}] ${p.title}`);
  }

  console.log('\n════════════════════════════════════════');
  console.log(`🎉 Created ${results.length} problems`);
  console.log(`   Easy: ${results.filter(p=>p.difficulty==='easy').length}`);
  console.log(`   Medium: ${results.filter(p=>p.difficulty==='medium').length}`);
  console.log(`   Hard: ${results.filter(p=>p.difficulty==='hard').length}`);
  console.log('════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});