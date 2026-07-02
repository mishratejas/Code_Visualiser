/**
 * CodeForge — Complete Database Seeder  (final)
 *
 * Passwords are hashed manually with rounds=10 and inserted via
 * collection.insertMany() to bypass the pre-save hook (avoids double-hash).
 *
 * Login credentials after seeding:
 *   admin@codeforge.com          /  123456
 *   tejasmishra040907@gmail.com  /  Tejas#04
 *   alice@example.com            /  Test1234!  (default for everyone else)
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Problem from '../src/models/problem.models.js';
import User from '../src/models/user.models.js';
import Submission from '../src/models/submission.models.js';
import Notification from '../src/models/notification.models.js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codeforge';
const PASSWORD    = 'Test1234!';

const ask = (q) => new Promise(resolve => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(q, ans => { rl.close(); resolve(ans.trim().toLowerCase()); });
});

const toSlug  = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const rand    = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const LANGUAGES    = ['python', 'cpp', 'java', 'javascript', 'go', 'rust'];
export const VERDICTS_BAD = ['wrong_answer', 'time_limit_exceeded', 'runtime_error', 'compilation_error'];
const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const SKILL_NAMES  = ['Arrays','Dynamic Programming','Graphs','Trees','Strings',
                      'Sorting','Binary Search','Recursion','Hash Tables','Two Pointers'];

const makeSkills = (n = 3) =>
  SKILL_NAMES.slice(0, n).map(name => ({ name, level: rand(SKILL_LEVELS) }));

// ── User data ──────────────────────────────────────────────────────────────
export const USERS = [
  { username: 'admin',       email: 'admin@codeforge.com',  password: '123456', role: 'admin', bio: 'Platform administrator',  country: 'India',       university: 'CodeForge HQ' },
  { username: 'tejas',       email: 'tejasmishra040907@gmail.com', password: 'Tejas#04', bio: 'Building CodeForge 🚀', country: 'India', university: 'CodeForge HQ' },
  { username: 'alice_coder', email: 'alice@example.com',    bio: 'DSA enthusiast 🔥',          country: 'India',       university: 'IIT Delhi' },
  { username: 'bob_dev',     email: 'bob@example.com',      bio: 'CS undergrad, loves DP',     country: 'USA',         university: 'MIT' },
  { username: 'charlie_cs',  email: 'charlie@example.com',  bio: 'Competitive programmer',      country: 'Canada',      university: 'UBC' },
  { username: 'diana_codes', email: 'diana@example.com',    bio: 'Full-stack + algo',           country: 'UK',          university: 'Oxford' },
  { username: 'evan_algo',   email: 'evan@example.com',     bio: 'Graph theory nerd',           country: 'Germany',     university: 'TU Munich' },
  { username: 'fatima_dev',  email: 'fatima@example.com',   bio: 'ML + competitive coding',    country: 'UAE',         university: 'NYU Abu Dhabi' },
  { username: 'grace_cp',    email: 'grace@example.com',    bio: 'ICPC regional finalist',     country: 'China',       university: 'Peking University' },
  { username: 'henry_h',     email: 'henry@example.com',    bio: 'Pythonista 🐍',              country: 'Brazil',      university: 'USP' },
  { username: 'iris_x',      email: 'iris@example.com',     bio: 'Loves graph problems',       country: 'Japan',       university: 'Tokyo University' },
  { username: 'jack_j',      email: 'jack@example.com',     bio: 'Backend engineer',           country: 'Australia',   university: 'ANU' },
  { username: 'kira_k',      email: 'kira@example.com',     bio: 'Rookie climber 📈',          country: 'France',      university: 'Sorbonne' },
  { username: 'liam_l',      email: 'liam@example.com',     bio: 'Daily coder streak 💪',      country: 'India',       university: 'NIT Trichy' },
  { username: 'mia_m',       email: 'mia@example.com',      bio: 'Loves string problems',      country: 'Singapore',   university: 'NUS' },
  { username: 'noah_n',      email: 'noah@example.com',     bio: 'Math + code',                country: 'USA',         university: 'Stanford' },
  { username: 'olivia_o',    email: 'olivia@example.com',   bio: 'Tree & graph master',        country: 'Canada',      university: 'Waterloo' },
  { username: 'pete_p',      email: 'pete@example.com',     bio: 'Bit manipulation fan',       country: 'UK',          university: 'Cambridge' },
  { username: 'quinn_q',     email: 'quinn@example.com',    bio: 'Divide and conquer',         country: 'India',       university: 'BITS Pilani' },
  { username: 'raj_r',       email: 'raj@example.com',      bio: 'Algo teacher',               country: 'India',       university: 'IIT Bombay' },
  { username: 'sara_s',      email: 'sara@example.com',     bio: 'Interview prep mode',        country: 'Netherlands', university: 'TU Delft' },
  { username: 'tom_t',       email: 'tom@example.com',      bio: 'Weekend warrior coder',      country: 'Sweden',      university: 'KTH' },
  { username: 'uma_u',       email: 'uma@example.com',      bio: 'Recursion lover',            country: 'India',       university: 'IISC' },
  { username: 'victor_v',    email: 'victor@example.com',   bio: 'System design + algo',       country: 'Russia',      university: 'Moscow SU' },
  { username: 'wendy_w',     email: 'wendy@example.com',    bio: 'LeetCode grinder',           country: 'Korea',       university: 'KAIST' },
  { username: 'xander_x',    email: 'xander@example.com',   bio: 'Competitive coder',          country: 'Poland',      university: 'Warsaw University' },
];

// ── Problems ───────────────────────────────────────────────────────────────
export const PROBLEMS = [
  {
    title: 'Two Sum', difficulty: 'easy', tags: ['array', 'hash-table'],
    description: `Given an array of integers **nums** and an integer **target**, return indices of the two numbers that add up to target.\n\n**Input:**\n- Line 1: n\n- Line 2: n integers\n- Line 3: target\n\n**Output:** Two space-separated indices (smaller first)`,
    inputFormat: 'n, then n integers, then target', outputFormat: 'Two indices',
    sampleInput: ['4\n2 7 11 15\n9'], sampleOutput: ['0 1'], sampleExplanation: ['nums[0]+nums[1]=9'],
    testCases: [
      { input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isHidden: false },
      { input: '3\n3 2 4\n6',     expectedOutput: '1 2', isHidden: false },
      { input: '2\n3 3\n6',       expectedOutput: '0 1', isHidden: true  },
      { input: '5\n1 5 3 7 8\n10',expectedOutput: '1 3', isHidden: true  },
    ],
    hints: [{ title: 'HashMap', content: 'For each num, check if (target-num) exists in the map.', order: 1 }],
    constraints: { timeLimit: 2000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 72, submissions: 1240, acceptedSubmissions: 893, views: 4500 },
  },
  {
    title: 'Reverse String', difficulty: 'easy', tags: ['string', 'two-pointers'],
    description: `Reverse a string in-place.\n\n**Input:** A single line string\n**Output:** The reversed string`,
    inputFormat: 'A single string', outputFormat: 'Reversed string',
    sampleInput: ['hello'], sampleOutput: ['olleh'], sampleExplanation: ['Each character reversed'],
    testCases: [
      { input: 'hello',  expectedOutput: 'olleh',  isHidden: false },
      { input: 'abcdef', expectedOutput: 'fedcba', isHidden: false },
      { input: 'racecar',expectedOutput: 'racecar',isHidden: true  },
      { input: 'a',      expectedOutput: 'a',      isHidden: true  },
    ],
    hints: [{ title: 'Two Pointers', content: 'Swap characters from start and end simultaneously.', order: 1 }],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: { isPublished: true, acceptanceRate: 85, submissions: 890, acceptedSubmissions: 757, views: 3200 },
  },
  {
    title: 'Valid Parentheses', difficulty: 'easy', tags: ['string', 'stack'],
    description: `Given a string containing '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An empty string is also valid.\n\n**Input:** A bracket string\n**Output:** true or false`,
    inputFormat: 'A bracket string', outputFormat: 'true or false',
    sampleInput: ['()[]{}'], sampleOutput: ['true'], sampleExplanation: ['All brackets are matched and ordered'],
    testCases: [
      { input: '()[]{}', expectedOutput: 'true',  isHidden: false },
      { input: '([)]',   expectedOutput: 'false', isHidden: false },
      { input: '{[]}',   expectedOutput: 'true',  isHidden: true  },
      { input: '((((',   expectedOutput: 'false', isHidden: true  },
    ],
    hints: [{ title: 'Stack', content: 'Push open brackets. On close bracket, check if top matches.', order: 1 }],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: { isPublished: true, acceptanceRate: 68, submissions: 980, acceptedSubmissions: 666, views: 3800 },
  },
  {
    title: 'Fibonacci Number', difficulty: 'easy', tags: ['math', 'dynamic-programming', 'recursion'],
    description: `Compute the n-th Fibonacci number (0-indexed).\nF(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2).\n\n**Input:** Integer n (0≤n≤45)\n**Output:** F(n)`,
    inputFormat: 'Single integer n', outputFormat: 'F(n)',
    sampleInput: ['10'], sampleOutput: ['55'], sampleExplanation: ['F(10) = 55'],
    testCases: [
      { input: '0',  expectedOutput: '0',          isHidden: false },
      { input: '1',  expectedOutput: '1',          isHidden: false },
      { input: '10', expectedOutput: '55',         isHidden: false },
      { input: '30', expectedOutput: '832040',     isHidden: true  },
      { input: '45', expectedOutput: '1134903170', isHidden: true  },
    ],
    hints: [{ title: 'Iterative', content: 'Use two variables to track F(n-1) and F(n-2).', order: 1 }],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: { isPublished: true, acceptanceRate: 78, submissions: 760, acceptedSubmissions: 593, views: 2800 },
  },
  {
    title: 'Binary Search', difficulty: 'easy', tags: ['array', 'binary-search'],
    description: `Given a sorted array and a target, return the index of target. Return -1 if not found.\n\n**Input:**\n- Line 1: n\n- Line 2: n sorted integers\n- Line 3: target\n\n**Output:** Index or -1`,
    inputFormat: 'Sorted array + target', outputFormat: 'Index or -1',
    sampleInput: ['6\n1 3 5 7 9 11\n7'], sampleOutput: ['3'], sampleExplanation: ['7 is at index 3'],
    testCases: [
      { input: '6\n1 3 5 7 9 11\n7', expectedOutput: '3',  isHidden: false },
      { input: '5\n2 4 6 8 10\n5',   expectedOutput: '-1', isHidden: false },
      { input: '4\n1 2 3 4\n1',      expectedOutput: '0',  isHidden: true  },
      { input: '4\n1 2 3 4\n4',      expectedOutput: '3',  isHidden: true  },
    ],
    hints: [{ title: 'Mid Point', content: 'Divide search space in half each step.', order: 1 }],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: { isPublished: true, acceptanceRate: 74, submissions: 1100, acceptedSubmissions: 814, views: 4000 },
  },
  {
    title: 'Merge Two Sorted Arrays', difficulty: 'easy', tags: ['array', 'two-pointers', 'sorting'],
    description: `Merge two sorted arrays into one sorted array.\n\n**Input:**\n- Line 1: m\n- Line 2: m sorted integers\n- Line 3: n\n- Line 4: n sorted integers\n\n**Output:** Merged sorted array space-separated`,
    inputFormat: 'Two sorted arrays with sizes', outputFormat: 'Merged sorted array',
    sampleInput: ['3\n1 3 5\n4\n2 4 6 8'], sampleOutput: ['1 2 3 4 5 6 8'], sampleExplanation: ['Compare and merge both arrays'],
    testCases: [
      { input: '3\n1 3 5\n4\n2 4 6 8', expectedOutput: '1 2 3 4 5 6 8', isHidden: false },
      { input: '2\n1 2\n2\n3 4',       expectedOutput: '1 2 3 4',       isHidden: false },
      { input: '1\n5\n3\n1 2 3',       expectedOutput: '1 2 3 5',       isHidden: true  },
      { input: '0\n\n3\n1 2 3',        expectedOutput: '1 2 3',         isHidden: true  },
    ],
    hints: [{ title: 'Two Pointer Merge', content: 'Compare heads, append smaller, advance that pointer.', order: 1 }],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: { isPublished: true, acceptanceRate: 80, submissions: 670, acceptedSubmissions: 536, views: 2200 },
  },
  {
    title: 'Longest Common Prefix', difficulty: 'easy', tags: ['string'],
    description: `Find the longest common prefix string among n strings. Output "NONE" if there is no common prefix.\n\n**Input:**\n- Line 1: n\n- Next n lines: one string each\n\n**Output:** Common prefix or NONE`,
    inputFormat: 'n strings one per line', outputFormat: 'Common prefix or NONE',
    sampleInput: ['3\nflower\nflow\nflight'], sampleOutput: ['fl'], sampleExplanation: ['"fl" is common to all three strings'],
    testCases: [
      { input: '3\nflower\nflow\nflight', expectedOutput: 'fl',    isHidden: false },
      { input: '3\ndog\nracecar\ncar',    expectedOutput: 'NONE', isHidden: false },
      { input: '2\nabc\nabc',            expectedOutput: 'abc',  isHidden: true  },
      { input: '1\nhello',              expectedOutput: 'hello', isHidden: true  },
    ],
    hints: [{ title: 'Horizontal Scan', content: 'Take first string as prefix, trim against each subsequent string.', order: 1 }],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: { isPublished: true, acceptanceRate: 65, submissions: 830, acceptedSubmissions: 540, views: 3100 },
  },
  {
    title: 'Maximum Subarray', difficulty: 'medium', tags: ['array', 'dynamic-programming', 'divide-and-conquer'],
    description: `Find the contiguous subarray with the largest sum.\n\n**Input:**\n- Line 1: n\n- Line 2: n integers (can be negative)\n\n**Output:** Maximum subarray sum`,
    inputFormat: 'Array size then elements', outputFormat: 'Maximum sum integer',
    sampleInput: ['9\n-2 1 -3 4 -1 2 1 -5 4'], sampleOutput: ['6'], sampleExplanation: ['Subarray [4,-1,2,1] = 6'],
    testCases: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6',  isHidden: false },
      { input: '1\n1',                      expectedOutput: '1',  isHidden: false },
      { input: '5\n-1 -2 -3 -4 -5',        expectedOutput: '-1', isHidden: true  },
      { input: '4\n1 2 3 4',               expectedOutput: '10', isHidden: true  },
    ],
    hints: [{ title: "Kadane's Algorithm", content: "Track current sum and max sum. If current sum < 0, reset to 0.", order: 1 }],
    constraints: { timeLimit: 2000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 58, submissions: 1520, acceptedSubmissions: 882, views: 5500 },
  },
  {
    title: 'Climbing Stairs', difficulty: 'medium', tags: ['math', 'dynamic-programming'],
    description: `Climb 1 or 2 steps at a time. How many distinct ways to reach the top of n stairs?\n\n**Input:** Single integer n (1≤n≤45)\n**Output:** Number of distinct ways`,
    inputFormat: 'Single integer n', outputFormat: 'Number of ways',
    sampleInput: ['5'], sampleOutput: ['8'], sampleExplanation: ['8 distinct combinations of 1s and 2s that sum to 5'],
    testCases: [
      { input: '2',  expectedOutput: '2',        isHidden: false },
      { input: '5',  expectedOutput: '8',        isHidden: false },
      { input: '10', expectedOutput: '89',       isHidden: true  },
      { input: '35', expectedOutput: '14930352', isHidden: true  },
    ],
    hints: [{ title: 'DP = Fibonacci', content: 'dp[n] = dp[n-1] + dp[n-2] because you can reach step n from n-1 or n-2.', order: 1 }],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: { isPublished: true, acceptanceRate: 62, submissions: 1340, acceptedSubmissions: 831, views: 4900 },
  },
  {
    title: 'Longest Substring Without Repeating Characters', difficulty: 'medium', tags: ['string', 'two-pointers', 'hash-table'],
    description: `Find the length of the longest substring without any repeating characters.\n\n**Input:** A single string\n**Output:** Length as integer`,
    inputFormat: 'A string', outputFormat: 'Length integer',
    sampleInput: ['abcabcbb'], sampleOutput: ['3'], sampleExplanation: ['"abc" is the longest substring without repeats, length 3'],
    testCases: [
      { input: 'abcabcbb', expectedOutput: '3', isHidden: false },
      { input: 'bbbbb',    expectedOutput: '1', isHidden: false },
      { input: 'pwwkew',   expectedOutput: '3', isHidden: true  },
      { input: 'a',        expectedOutput: '1', isHidden: true  },
    ],
    hints: [{ title: 'Sliding Window', content: 'Use a set to track chars in window. Expand right, shrink left on duplicate.', order: 1 }],
    constraints: { timeLimit: 2000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 44, submissions: 1890, acceptedSubmissions: 832, views: 6800 },
  },
  {
    title: 'Product of Array Except Self', difficulty: 'medium', tags: ['array'],
    description: `Return array where output[i] equals product of all elements except nums[i]. Solve in O(n) time without division.\n\n**Input:**\n- Line 1: n\n- Line 2: n integers\n\n**Output:** n space-separated products`,
    inputFormat: 'Array size then elements', outputFormat: 'Space-separated product array',
    sampleInput: ['4\n1 2 3 4'], sampleOutput: ['24 12 8 6'], sampleExplanation: ['Each position holds product of all other elements'],
    testCases: [
      { input: '4\n1 2 3 4',   expectedOutput: '24 12 8 6', isHidden: false },
      { input: '3\n2 3 4',     expectedOutput: '12 8 6',    isHidden: false },
      { input: '4\n-1 1 0 -3', expectedOutput: '0 0 3 0',  isHidden: true  },
    ],
    hints: [
      { title: 'Prefix Products', content: 'Build left[i] = product of all elements to the left of i.', order: 1 },
      { title: 'Then Suffix', content: 'Multiply each position by product of all elements to the right.', order: 2 },
    ],
    constraints: { timeLimit: 2000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 48, submissions: 980, acceptedSubmissions: 471, views: 3600 },
  },
  {
    title: 'Container With Most Water', difficulty: 'medium', tags: ['array', 'two-pointers', 'greedy'],
    description: `Given n heights, find two lines that form a container holding the most water. Width is distance between them.\n\n**Input:**\n- Line 1: n\n- Line 2: n heights\n\n**Output:** Maximum water area`,
    inputFormat: 'n heights', outputFormat: 'Maximum area integer',
    sampleInput: ['9\n1 8 6 2 5 4 8 3 7'], sampleOutput: ['49'], sampleExplanation: ['Lines at index 1(h=8) and 8(h=7), min(8,7)*7 = 49'],
    testCases: [
      { input: '9\n1 8 6 2 5 4 8 3 7', expectedOutput: '49', isHidden: false },
      { input: '2\n1 1',               expectedOutput: '1',  isHidden: false },
      { input: '4\n4 3 2 1',           expectedOutput: '4',  isHidden: true  },
      { input: '3\n1 2 1',             expectedOutput: '2',  isHidden: true  },
    ],
    hints: [{ title: 'Two Pointers', content: 'Start from both ends. Move the pointer at the shorter line inward.', order: 1 }],
    constraints: { timeLimit: 2000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 41, submissions: 1460, acceptedSubmissions: 599, views: 5300 },
  },
  {
    title: 'Coin Change', difficulty: 'medium', tags: ['dynamic-programming', 'graph'],
    description: `Find the minimum number of coins to make the given amount. Return -1 if impossible.\n\n**Input:**\n- Line 1: n (number of coin denominations)\n- Line 2: n coin values\n- Line 3: target amount\n\n**Output:** Minimum coins or -1`,
    inputFormat: 'Coin denominations then amount', outputFormat: 'Minimum coins or -1',
    sampleInput: ['3\n1 5 6\n11'], sampleOutput: ['2'], sampleExplanation: ['Use coin 5 + coin 6 = 11, total 2 coins'],
    testCases: [
      { input: '3\n1 5 6\n11',   expectedOutput: '2',  isHidden: false },
      { input: '3\n1 2 5\n11',   expectedOutput: '3',  isHidden: false },
      { input: '1\n2\n3',        expectedOutput: '-1', isHidden: true  },
      { input: '3\n1 5 10\n100', expectedOutput: '10', isHidden: true  },
    ],
    hints: [
      { title: 'Bottom-up DP', content: 'dp[i] = minimum coins to make amount i. Initialize to infinity.', order: 1 },
      { title: 'Recurrence', content: 'dp[i] = min(dp[i], dp[i - coin] + 1) for each coin ≤ i.', order: 2 },
    ],
    constraints: { timeLimit: 3000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 42, submissions: 1680, acceptedSubmissions: 706, views: 6100 },
  },
  {
    title: '3Sum', difficulty: 'medium', tags: ['array', 'two-pointers', 'sorting'],
    description: `Find all unique triplets [a,b,c] such that a+b+c = 0.\n\n**Input:**\n- Line 1: n\n- Line 2: n integers\n\n**Output:** Each triplet (sorted) on a new line, result sorted lexicographically. "NONE" if no triplets exist.`,
    inputFormat: 'Array size then elements', outputFormat: 'Triplets or NONE',
    sampleInput: ['6\n-1 0 1 2 -1 -4'], sampleOutput: ['-1 -1 2\n-1 0 1'], sampleExplanation: ['Two unique triplets sum to zero'],
    testCases: [
      { input: '6\n-1 0 1 2 -1 -4', expectedOutput: '-1 -1 2\n-1 0 1', isHidden: false },
      { input: '3\n0 0 0',          expectedOutput: '0 0 0',           isHidden: false },
      { input: '3\n1 2 3',          expectedOutput: 'NONE',            isHidden: true  },
    ],
    hints: [
      { title: 'Sort First', content: 'Sorting enables skipping duplicate triplets easily.', order: 1 },
      { title: 'Fix + Two Pointer', content: 'Fix nums[i], then use two pointers from i+1 and end.', order: 2 },
    ],
    constraints: { timeLimit: 3000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 36, submissions: 2100, acceptedSubmissions: 756, views: 7600 },
  },
  {
    title: 'Word Search', difficulty: 'medium', tags: ['array', 'backtracking'],
    description: `Determine if a word exists in an m×n character grid. The word can be formed from horizontally or vertically adjacent cells. Each cell may only be used once.\n\n**Input:**\n- Line 1: m n\n- Next m lines: space-separated characters\n- Last line: target word\n\n**Output:** true or false`,
    inputFormat: 'Grid dimensions, grid rows, then word', outputFormat: 'true or false',
    sampleInput: ['3 4\nA B C E\nS F C S\nA D E E\nABCCED'], sampleOutput: ['true'], sampleExplanation: ['ABCCED can be traced through the grid'],
    testCases: [
      { input: '3 4\nA B C E\nS F C S\nA D E E\nABCCED', expectedOutput: 'true',  isHidden: false },
      { input: '3 4\nA B C E\nS F C S\nA D E E\nABCB',   expectedOutput: 'false', isHidden: false },
      { input: '3 4\nA B C E\nS F C S\nA D E E\nSEE',    expectedOutput: 'true',  isHidden: true  },
    ],
    hints: [{ title: 'DFS Backtracking', content: 'Try each cell as start. DFS in 4 directions. Mark visited, unmark on backtrack.', order: 1 }],
    constraints: { timeLimit: 4000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 34, submissions: 1320, acceptedSubmissions: 449, views: 4800 },
  },
  {
    title: 'Trapping Rain Water', difficulty: 'hard', tags: ['array', 'two-pointers', 'dynamic-programming', 'stack'],
    description: `Given an elevation map, compute the total units of water it can trap after raining.\n\n**Input:**\n- Line 1: n\n- Line 2: n non-negative heights\n\n**Output:** Total water trapped`,
    inputFormat: 'Height array', outputFormat: 'Water units integer',
    sampleInput: ['12\n0 1 0 2 1 0 1 3 2 1 2 1'], sampleOutput: ['6'], sampleExplanation: ['Total of 6 units of water can be trapped between bars'],
    testCases: [
      { input: '12\n0 1 0 2 1 0 1 3 2 1 2 1', expectedOutput: '6', isHidden: false },
      { input: '6\n4 2 0 3 2 5',              expectedOutput: '9', isHidden: false },
      { input: '3\n3 0 3',                    expectedOutput: '3', isHidden: true  },
      { input: '1\n5',                        expectedOutput: '0', isHidden: true  },
    ],
    hints: [
      { title: 'Precompute Max Heights', content: 'water[i] = min(max_left[i], max_right[i]) - height[i]', order: 1 },
      { title: 'Two Pointer O(1) space', content: 'Track maxLeft and maxRight pointers, move the smaller inward.', order: 2 },
    ],
    constraints: { timeLimit: 3000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 30, submissions: 1950, acceptedSubmissions: 585, views: 7200 },
  },
  {
    title: 'Median of Two Sorted Arrays', difficulty: 'hard', tags: ['array', 'binary-search', 'divide-and-conquer'],
    description: `Find the median of two sorted arrays combined. Runtime must be O(log(m+n)).\n\n**Input:**\n- Line 1: m\n- Line 2: m sorted integers\n- Line 3: n\n- Line 4: n sorted integers\n\n**Output:** Median with exactly 1 decimal place`,
    inputFormat: 'Two sorted arrays with sizes', outputFormat: 'Median as decimal',
    sampleInput: ['2\n1 3\n1\n2'], sampleOutput: ['2.0'], sampleExplanation: ['Merged: [1,2,3], median = 2.0'],
    testCases: [
      { input: '2\n1 3\n1\n2',   expectedOutput: '2.0', isHidden: false },
      { input: '2\n1 2\n2\n3 4', expectedOutput: '2.5', isHidden: false },
      { input: '1\n1\n1\n2',     expectedOutput: '1.5', isHidden: true  },
      { input: '3\n1 2 3\n0\n',  expectedOutput: '2.0', isHidden: true  },
    ],
    hints: [{ title: 'Binary Search on Partition', content: 'Binary search on the smaller array to find the correct partition point.', order: 1 }],
    constraints: { timeLimit: 3000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 22, submissions: 1100, acceptedSubmissions: 242, views: 6400 },
  },
  {
    title: 'N-Queens', difficulty: 'hard', tags: ['backtracking', 'recursion'],
    description: `Count distinct solutions for placing n non-attacking queens on an n×n chessboard.\n\n**Input:** Single integer n (1≤n≤9)\n**Output:** Number of distinct solutions`,
    inputFormat: 'Single integer n', outputFormat: 'Number of solutions',
    sampleInput: ['4'], sampleOutput: ['2'], sampleExplanation: ['There are exactly 2 solutions for n=4'],
    testCases: [
      { input: '1', expectedOutput: '1',   isHidden: false },
      { input: '4', expectedOutput: '2',   isHidden: false },
      { input: '8', expectedOutput: '92',  isHidden: true  },
      { input: '9', expectedOutput: '352', isHidden: true  },
    ],
    hints: [{ title: 'Row by Row', content: 'Place one queen per row. Track which columns and diagonals are attacked.', order: 1 }],
    constraints: { timeLimit: 5000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 18, submissions: 760, acceptedSubmissions: 137, views: 4300 },
  },
  {
    title: 'LRU Cache', difficulty: 'hard', tags: ['hash-table', 'linked-list'],
    description: `Design a data structure for Least Recently Used (LRU) caching.\n\nProcess commands:\n- \`SET key value\` — insert or update entry\n- \`GET key\` → print value or -1 if not found\n- \`END\` → stop\n\n**Input:** Line 1 = capacity, then commands\n**Output:** Results of GET commands, one per line`,
    inputFormat: 'Capacity then SET/GET/END commands', outputFormat: 'GET results one per line',
    sampleInput: ['3\nSET 1 1\nSET 2 2\nGET 1\nSET 3 3\nGET 2\nEND'], sampleOutput: ['1\n-1'], sampleExplanation: ['After SET 3, key 2 was least recently used and was evicted'],
    testCases: [
      { input: '3\nSET 1 1\nSET 2 2\nGET 1\nSET 3 3\nGET 2\nEND', expectedOutput: '1\n-1', isHidden: false },
      { input: '2\nSET 1 10\nSET 2 20\nGET 1\nSET 3 30\nGET 2\nGET 3\nEND', expectedOutput: '10\n-1\n30', isHidden: false },
    ],
    hints: [{ title: 'HashMap + Doubly Linked List', content: 'HashMap gives O(1) lookup. DLL gives O(1) insert/remove for LRU ordering.', order: 1 }],
    constraints: { timeLimit: 5000, memoryLimit: 512 },
    metadata: { isPublished: true, acceptanceRate: 25, submissions: 890, acceptedSubmissions: 223, views: 5200 },
  },
  {
    title: 'Regular Expression Matching', difficulty: 'hard', tags: ['string', 'dynamic-programming', 'recursion'],
    description: `Implement regex matching supporting:\n- \`.\` matches any single character\n- \`*\` matches zero or more of the preceding element\n\n**Input:**\n- Line 1: string s\n- Line 2: pattern p\n\n**Output:** true or false`,
    inputFormat: 'String then pattern on separate lines', outputFormat: 'true or false',
    sampleInput: ['aa\na*'], sampleOutput: ['true'], sampleExplanation: ['"a*" means zero or more "a"s, which matches "aa"'],
    testCases: [
      { input: 'aa\na*',  expectedOutput: 'true',  isHidden: false },
      { input: 'ab\n.*', expectedOutput: 'true',  isHidden: false },
      { input: 'mississippi\nmis*is*p*.', expectedOutput: 'false', isHidden: true },
      { input: 'aab\nc*a*b', expectedOutput: 'true', isHidden: true },
    ],
    hints: [
      { title: '2D DP Table', content: 'dp[i][j] = does s[0..i-1] match p[0..j-1]?', order: 1 },
      { title: 'Star handling', content: 'p[j-1] == "*" means try 0 matches (dp[i][j-2]) or extend (p[j-2] matches s[i-1]).', order: 2 },
    ],
    constraints: { timeLimit: 3000, memoryLimit: 256 },
    metadata: { isPublished: true, acceptanceRate: 15, submissions: 920, acceptedSubmissions: 138, views: 5800 },
  },
];

// ── Sample code snippets ───────────────────────────────────────────────────
export const CODE = {
  cpp:        `#include<bits/stdc++.h>\nusing namespace std;\nint main(){\n  // solution here\n  return 0;\n}`,
  python:     `import sys\ndata = sys.stdin.read().split()\n# solution here`,
  java:       `import java.util.*;\npublic class Solution {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    // solution here\n  }\n}`,
  javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\n// solution here`,
  go:         `package main\nimport "fmt"\nfunc main() {\n  // solution here\n  fmt.Println()\n}`,
  rust:       `use std::io::{self,Read};\nfn main(){\n  let mut s=String::new();\n  io::stdin().read_to_string(&mut s).unwrap();\n  // solution here\n}`,
};

// ── Main seed ──────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🌱 CodeForge — Full Database Seeder');
  console.log('════════════════════════════════════════');
  console.log(`\n🔑 All users will have password: ${PASSWORD}`);

  const ans = await ask('\n⚠️  This will CLEAR all problems, submissions, and users.\nType "yes" to continue: ');
  if (ans !== 'yes') { console.log('❌ Aborted.'); process.exit(0); }

  await mongoose.connect(MONGODB_URI);
  console.log('✅ MongoDB connected');

  console.log('\n🗑️  Clearing...');
  await Promise.all([
    Problem.deleteMany({}),
    Submission.deleteMany({}),
    User.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('✅ Cleared');

  // Hash passwords, manually, at rounds=10 (fast, secure enough for dev).
  // Most users share the default PASSWORD, but a few (admin, tejas) have an
  // explicit `password` override in their USERS entry — hash each unique
  // password once and cache it, rather than hashing the same string N times
  // or (the bug this replaces) silently giving everyone the same hash
  // regardless of what was specified per-user.
  console.log('\n🔐 Hashing passwords (rounds=10)...');
  const hashCache = new Map();
  const hashFor = (plain) => {
    if (!hashCache.has(plain)) {
      const h = bcrypt.hashSync(plain, 10);
      if (!bcrypt.compareSync(plain, h)) { console.error(`❌ Hash verification failed for a password!`); process.exit(1); }
      hashCache.set(plain, h);
    }
    return hashCache.get(plain);
  };
  const hash = hashFor(PASSWORD); // kept for anything still referencing the old shared `hash` var
  console.log(`✅ Hashed ${new Set(USERS.map(u => u.password || PASSWORD)).size} unique password(s)`);

  // ── Users — bypass pre-save hook with collection.insertMany ─────────────
  console.log('\n👥 Creating users...');
  const now = new Date();
  const userDocs = USERS.map(u => {
    const easy   = randInt(0, 25);
    const medium = randInt(0, 20);
    const hard   = randInt(0, 10);
    const solved = easy + medium + hard;
    const subs   = randInt(solved + 5, solved * 3 + 20);
    return {
      _id:               new mongoose.Types.ObjectId(),
      username:          u.username,
      email:             u.email,
      password:          hashFor(u.password || PASSWORD),
      role:              u.role || 'user',
      isEmailVerified:   true,
      isActive:          true,
      isProfileComplete: true,
      profile: {
        name:       u.username,
        bio:        u.bio        || 'Coding enthusiast',
        country:    u.country    || 'India',
        university: u.university || 'CodeForge University',
        skills:     makeSkills(randInt(2, 4)),
      },
      stats: {
        totalSubmissions:    subs,
        acceptedSubmissions: solved,
        totalProblemsSolved: solved,
        easySolved:          easy,
        mediumSolved:        medium,
        hardSolved:          hard,
        streak:              randInt(0, 45),
        maxStreak:           randInt(5, 100),
        rank:                randInt(1, 10000),
        score:               easy * 10 + medium * 30 + hard * 50,
        lastActiveDate:      new Date(now - randInt(0, 7 * 86400000)),
      },
      preferences: {
        theme:           rand(['dark', 'light', 'auto']),
        defaultLanguage: rand(LANGUAGES),
      },
      security:    { failedLoginAttempts: 0 },
      bookmarks:   [],
      solvedProblems:    [],
      attemptedProblems: [],
      createdAt: new Date(now - randInt(0, 180 * 86400000)),
      updatedAt: now,
    };
  });

  // Insert directly — NO pre-save hook, NO double-hash
  await User.collection.insertMany(userDocs);
  console.log(`✅ Created ${userDocs.length} users`);

  // ── Problems ─────────────────────────────────────────────────────────────
  console.log('\n📚 Creating problems...');
  const adminUser = userDocs.find(u => u.role === 'admin');
  const createdProblems = [];

  for (const p of PROBLEMS) {
    const prob = await Problem.create({
      title: p.title, slug: toSlug(p.title), description: p.description,
      difficulty: p.difficulty, tags: p.tags,
      inputFormat: p.inputFormat, outputFormat: p.outputFormat,
      sampleInput: p.sampleInput, sampleOutput: p.sampleOutput,
      sampleExplanation: p.sampleExplanation || [],
      testCases: p.testCases, hints: p.hints || [],
      constraints: p.constraints, metadata: p.metadata,
      createdBy: adminUser._id,
    });
    createdProblems.push(prob);
  }
  console.log(`✅ Created ${createdProblems.length} problems`);

  // ── Submissions ───────────────────────────────────────────────────────────
  console.log('\n📝 Creating submissions...');
  const regularUsers = userDocs.filter(u => u.role !== 'admin');
  let totalSubs = 0;

  for (const user of regularUsers) {
    const n        = randInt(5, createdProblems.length);
    const shuffled = [...createdProblems].sort(() => Math.random() - 0.5);

    for (let i = 0; i < n; i++) {
      const prob     = shuffled[i];
      const accepted = Math.random() < 0.65;
      const lang     = rand(LANGUAGES);
      const passed   = accepted ? prob.testCases.length : randInt(0, prob.testCases.length - 1);

      await Submission.create({
        user:            user._id,
        problem:         prob._id,
        language:        lang,
        code:            CODE[lang] || CODE.cpp,
        verdict:         accepted ? 'accepted' : rand(VERDICTS_BAD),
        executionTime:   randInt(10, 800),
        memoryUsed:      randInt(4, 128),
        testCasesPassed: passed,
        totalTestCases:  prob.testCases.length,
        isContest:       false,
        createdAt:       new Date(now - randInt(0, 90 * 86400000)),
      });
      totalSubs++;
    }
  }
  console.log(`✅ Created ${totalSubs} submissions`);

  // ── Update problem stats from actual submissions ───────────────────────
  console.log('\n📊 Updating problem stats from submissions...');
  for (const prob of createdProblems) {
    const total    = await Submission.countDocuments({ problem: prob._id });
    const accepted = await Submission.countDocuments({ problem: prob._id, verdict: 'accepted' });
    await Problem.updateOne({ _id: prob._id }, {
      'metadata.submissions':         total,
      'metadata.acceptedSubmissions': accepted,
      'metadata.acceptanceRate':      total > 0 ? Math.round((accepted / total) * 100) : 0,
    });
  }
  console.log('✅ Stats updated');

  // ── Notifications ─────────────────────────────────────────────────────────
  console.log('\n🔔 Creating notifications...');
  const notifs = [
    { type: 'system',      title: 'Welcome to CodeForge! 🎉',  message: 'Start solving problems to build your coding streak.' },
    { type: 'achievement', title: 'First Problem Solved!',      message: 'You solved your first problem. Keep going! 💪' },
    { type: 'system',      title: 'New Contest Available',      message: 'A new contest has been published. Register now!' },
    { type: 'system',      title: 'Daily Streak Reminder 🔥',   message: 'Keep your streak alive — solve a problem today.' },
    { type: 'achievement', title: '5-Day Streak!',              message: "You've maintained a 5-day coding streak!" },
  ];
  let notifCount = 0;
  for (const user of regularUsers.slice(0, 15)) {
    for (let i = 0; i < randInt(1, 4); i++) {
      const t = notifs[i % notifs.length];
      await Notification.create({ user: user._id, type: t.type, title: t.title, message: t.message, isRead: Math.random() > 0.5 });
      notifCount++;
    }
  }
  console.log(`✅ Created ${notifCount} notifications`);

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════');
  console.log('🎉 Seeding Complete!');
  console.log(`   👥 Users:         ${userDocs.length}`);
  console.log(`   📚 Problems:      ${createdProblems.length}`);
  console.log(`   📝 Submissions:   ${totalSubs}`);
  console.log(`   🔔 Notifications: ${notifCount}`);
  console.log('\n🔑 Login with:');
  console.log(`   admin@codeforge.com          /  123456`);
  console.log(`   tejasmishra040907@gmail.com  /  Tejas#04`);
  console.log(`   alice@example.com            /  ${PASSWORD}   (default for everyone else)`);
  console.log('════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

// Only auto-run when this file is executed directly (e.g. `node seedComplete.js`),
// not when imported by another script (e.g. seedEverything.js reusing USERS/PROBLEMS).
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed().catch(err => {
    console.error('❌ Seed failed:', err.message || err);
    process.exit(1);
  });
}