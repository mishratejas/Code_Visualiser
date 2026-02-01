import mongoose from 'mongoose';
import Problem from '../src/models/problem.models.js';
import User from '../src/models/user.models.js';
import Submission from '../src/models/submission.models.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codejudge';

// Helper to generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Comprehensive problem data with CORRECT tags matching your schema
const problemsData = [
  {
    title: "Two Sum",
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    difficulty: "easy",
    tags: ["array", "hash-table"], // FIXED: lowercase, hyphenated
    category: "algorithm",
    inputFormat: "First line contains n (number of elements)\\nSecond line contains n space-separated integers\\nThird line contains target integer",
    outputFormat: "Two space-separated integers representing the indices",
    sampleInput: ["4\\n2 7 11 15\\n9"],
    sampleOutput: ["0 1"],
    sampleExplanation: ["nums[0] + nums[1] = 2 + 7 = 9, so we return [0, 1]"],
    testCases: [
      { input: "4\\n2 7 11 15\\n9", expectedOutput: "0 1", isHidden: false },
      { input: "3\\n3 2 4\\n6", expectedOutput: "1 2", isHidden: false },
      { input: "2\\n3 3\\n6", expectedOutput: "0 1", isHidden: false },
      { input: "5\\n1 5 3 7 8\\n10", expectedOutput: "1 3", isHidden: true },
      { input: "6\\n-1 -2 -3 -4 -5\\n-8", expectedOutput: "2 4", isHidden: true }
    ],
    hints: [
      { title: "Use Hash Map", content: "Try using a hash map to store numbers you've seen", order: 1 },
      { title: "Single Pass", content: "You can solve this in a single pass through the array", order: 2 }
    ],
    constraints: { timeLimit: 2000, memoryLimit: 256 },
    metadata: { isPublished: true, views: 15234, submissions: 8934, likes: 1234, dislikes: 45, bookmarks: 567 }
  },
  {
    title: "Reverse String",
    description: `Write a function that reverses a string. The input string is given as an array of characters.

You must do this by modifying the input array in-place with O(1) extra memory.`,
    difficulty: "easy",
    tags: ["string", "two-pointers"],
    category: "algorithm",
    inputFormat: "A single line containing the string",
    outputFormat: "The reversed string",
    sampleInput: ["hello"],
    sampleOutput: ["olleh"],
    sampleExplanation: ["Simply reverse the characters in the string"],
    testCases: [
      { input: "hello", expectedOutput: "olleh", isHidden: false },
      { input: "world", expectedOutput: "dlrow", isHidden: false },
      { input: "a", expectedOutput: "a", isHidden: false },
      { input: "programming", expectedOutput: "gnimmargorp", isHidden: true },
      { input: "algorithm", expectedOutput: "mhtirogla", isHidden: true }
    ],
    hints: [{ title: "Two Pointers", content: "Use two pointers, one at start and one at end", order: 1 }],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: { isPublished: true, views: 12456, submissions: 9823, likes: 890, dislikes: 23, bookmarks: 445 }
  },
  {
    title: "Valid Parentheses",
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.`,
    difficulty: "easy",
    tags: ["string", "stack"],
    category: "algorithm",
    inputFormat: "A single line containing the string with parentheses",
    outputFormat: "true or false",
    sampleInput: ["()"],
    sampleOutput: ["true"],
    sampleExplanation: ["The parentheses are properly matched"],
    testCases: [
      { input: "()", expectedOutput: "true", isHidden: false },
      { input: "()[]{}", expectedOutput: "true", isHidden: false },
      { input: "(]", expectedOutput: "false", isHidden: false },
      { input: "([)]", expectedOutput: "false", isHidden: true },
      { input: "{[]}", expectedOutput: "true", isHidden: true }
    ],
    hints: [{ title: "Use Stack", content: "Stack is perfect for matching pairs", order: 1 }],
    constraints: { timeLimit: 2000, memoryLimit: 256 },
    metadata: { isPublished: true, views: 18934, submissions: 11245, likes: 1567, dislikes: 89, bookmarks: 789 }
  },
  {
    title: "Longest Common Subsequence",
    description: `Given two strings text1 and text2, return the length of their longest common subsequence.

A subsequence of a string is a new string generated from the original string with some characters deleted without changing the relative order of the remaining characters.`,
    difficulty: "medium",
    tags: ["dynamic-programming", "string"],
    category: "algorithm",
    inputFormat: "Two lines, each containing a string",
    outputFormat: "An integer representing the length of LCS",
    sampleInput: ["abcde\\nabce"],
    sampleOutput: ["4"],
    sampleExplanation: ["The longest common subsequence is 'abce' with length 4"],
    testCases: [
      { input: "abcde\\nabce", expectedOutput: "4", isHidden: false },
      { input: "abc\\nabc", expectedOutput: "3", isHidden: false },
      { input: "abc\\ndef", expectedOutput: "0", isHidden: false },
      { input: "aggtab\\ngxtxayb", expectedOutput: "4", isHidden: true },
      { input: "programming\\ncomputing", expectedOutput: "7", isHidden: true }
    ],
    hints: [
      { title: "Dynamic Programming", content: "Use 2D DP array to store subproblem results", order: 1 },
      { title: "Recurrence Relation", content: "If characters match, add 1 to diagonal value", order: 2 }
    ],
    constraints: { timeLimit: 3000, memoryLimit: 512 },
    metadata: { isPublished: true, views: 9876, submissions: 4523, likes: 2134, dislikes: 167, bookmarks: 1023 }
  },
  {
    title: "Binary Tree Level Order Traversal",
    description: `Given the root of a binary tree, return the level order traversal of its nodes' values (from left to right, level by level).`,
    difficulty: "medium",
    tags: ["tree", "queue"],
    category: "algorithm",
    inputFormat: "Array representation of binary tree (level order), use null for missing nodes",
    outputFormat: "2D array where each subarray represents a level",
    sampleInput: ["3 9 20 null null 15 7"],
    sampleOutput: ["[[3],[9,20],[15,7]]"],
    sampleExplanation: ["Level 0: [3], Level 1: [9,20], Level 2: [15,7]"],
    testCases: [
      { input: "3 9 20 null null 15 7", expectedOutput: "[[3],[9,20],[15,7]]", isHidden: false },
      { input: "1", expectedOutput: "[[1]]", isHidden: false },
      { input: "1 2 3 4 5", expectedOutput: "[[1],[2,3],[4,5]]", isHidden: true },
      { input: "1 2 null 3 null 4 null 5", expectedOutput: "[[1],[2],[3],[4],[5]]", isHidden: true }
    ],
    hints: [
      { title: "Use Queue", content: "BFS using queue is perfect for level order traversal", order: 1 },
      { title: "Track Level", content: "Process all nodes at current level before moving to next", order: 2 }
    ],
    constraints: { timeLimit: 2000, memoryLimit: 256 },
    metadata: { isPublished: true, views: 11234, submissions: 5678, likes: 1890, dislikes: 234, bookmarks: 892 }
  },
  {
    title: "Merge K Sorted Lists",
    description: `You are given an array of k linked-lists, each sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.`,
    difficulty: "hard",
    tags: ["linked-list", "heap", "divide-and-conquer"],
    category: "algorithm",
    inputFormat: "First line: k (number of lists)\\nNext k lines: space-separated integers (each list)",
    outputFormat: "Space-separated integers representing merged sorted list",
    sampleInput: ["3\\n1 4 5\\n1 3 4\\n2 6"],
    sampleOutput: ["1 1 2 3 4 4 5 6"],
    sampleExplanation: ["Merging all three lists results in [1,1,2,3,4,4,5,6]"],
    testCases: [
      { input: "3\\n1 4 5\\n1 3 4\\n2 6", expectedOutput: "1 1 2 3 4 4 5 6", isHidden: false },
      { input: "1\\n1 2 3", expectedOutput: "1 2 3", isHidden: false },
      { input: "2\\n\\n1", expectedOutput: "1", isHidden: true },
      { input: "4\\n1 5 9\\n2 6 10\\n3 7 11\\n4 8 12", expectedOutput: "1 2 3 4 5 6 7 8 9 10 11 12", isHidden: true }
    ],
    hints: [
      { title: "Priority Queue", content: "Use min heap to always get the smallest element", order: 1 },
      { title: "Divide and Conquer", content: "Can also solve by merging lists in pairs", order: 2 }
    ],
    constraints: { timeLimit: 5000, memoryLimit: 512 },
    metadata: { isPublished: true, views: 7823, submissions: 2134, likes: 3456, dislikes: 456, bookmarks: 1567 }
  },
  {
    title: "Maximum Subarray Sum",
    description: `Given an integer array nums, find the contiguous subarray which has the largest sum and return its sum.`,
    difficulty: "medium",
    tags: ["array", "dynamic-programming"],
    category: "algorithm",
    inputFormat: "First line: n (size of array)\\nSecond line: n space-separated integers",
    outputFormat: "Single integer (maximum subarray sum)",
    sampleInput: ["9\\n-2 1 -3 4 -1 2 1 -5 4"],
    sampleOutput: ["6"],
    sampleExplanation: ["[4,-1,2,1] has the largest sum = 6"],
    testCases: [
      { input: "9\\n-2 1 -3 4 -1 2 1 -5 4", expectedOutput: "6", isHidden: false },
      { input: "1\\n1", expectedOutput: "1", isHidden: false },
      { input: "5\\n5 4 -1 7 8", expectedOutput: "23", isHidden: false },
      { input: "8\\n-1 -2 -3 -4 -5 -6 -7 -8", expectedOutput: "-1", isHidden: true }
    ],
    hints: [{ title: "Kadane's Algorithm", content: "Keep track of maximum ending at current position", order: 1 }],
    constraints: { timeLimit: 2000, memoryLimit: 256 },
    metadata: { isPublished: true, views: 14567, submissions: 7234, likes: 2890, dislikes: 123, bookmarks: 1345 }
  },
  {
    title: "Climbing Stairs",
    description: `You are climbing a staircase. It takes n steps to reach the top. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?`,
    difficulty: "easy",
    tags: ["dynamic-programming", "math"],
    category: "algorithm",
    inputFormat: "Single integer n (number of steps)",
    outputFormat: "Single integer (number of distinct ways)",
    sampleInput: ["2"],
    sampleOutput: ["2"],
    sampleExplanation: ["Two ways: 1+1 or 2"],
    testCases: [
      { input: "2", expectedOutput: "2", isHidden: false },
      { input: "3", expectedOutput: "3", isHidden: false },
      { input: "5", expectedOutput: "8", isHidden: true },
      { input: "10", expectedOutput: "89", isHidden: true }
    ],
    hints: [{ title: "Fibonacci Pattern", content: "This follows Fibonacci sequence", order: 1 }],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: { isPublished: true, views: 16789, submissions: 12345, likes: 3456, dislikes: 234, bookmarks: 1678 }
  },
  {
    title: "Coin Change",
    description: `You are given coins of different denominations and a total amount. Return the fewest number of coins needed to make up that amount. If impossible, return -1.`,
    difficulty: "medium",
    tags: ["dynamic-programming", "array"],
    category: "algorithm",
    inputFormat: "First line: n (coin types) and amount\\nSecond line: n space-separated integers",
    outputFormat: "Single integer (minimum coins needed, or -1)",
    sampleInput: ["3 11\\n1 2 5"],
    sampleOutput: ["3"],
    sampleExplanation: ["11 = 5 + 5 + 1"],
    testCases: [
      { input: "3 11\\n1 2 5", expectedOutput: "3", isHidden: false },
      { input: "1 3\\n2", expectedOutput: "-1", isHidden: false },
      { input: "4 15\\n1 5 6 9", expectedOutput: "2", isHidden: true }
    ],
    hints: [{ title: "Bottom-up DP", content: "Build solutions for smaller amounts first", order: 1 }],
    constraints: { timeLimit: 3000, memoryLimit: 256 },
    metadata: { isPublished: true, views: 10234, submissions: 4567, likes: 2345, dislikes: 189, bookmarks: 987 }
  },
  {
    title: "Trapping Rain Water",
    description: `Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.`,
    difficulty: "hard",
    tags: ["array", "two-pointers", "stack"],
    category: "algorithm",
    inputFormat: "First line: n (size)\\nSecond line: n space-separated integers (heights)",
    outputFormat: "Single integer (units of trapped water)",
    sampleInput: ["12\\n0 1 0 2 1 0 1 3 2 1 2 1"],
    sampleOutput: ["6"],
    sampleExplanation: ["The elevation map traps 6 units of rain water"],
    testCases: [
      { input: "12\\n0 1 0 2 1 0 1 3 2 1 2 1", expectedOutput: "6", isHidden: false },
      { input: "6\\n4 2 0 3 2 5", expectedOutput: "9", isHidden: false },
      { input: "1\\n5", expectedOutput: "0", isHidden: true }
    ],
    hints: [{ title: "Two Pointers", content: "Use two pointers from both ends", order: 1 }],
    constraints: { timeLimit: 3000, memoryLimit: 256 },
    metadata: { isPublished: true, views: 8923, submissions: 2456, likes: 5678, dislikes: 234, bookmarks: 2345 }
  },
  {
    title: "Palindrome Number",
    description: `Given an integer x, return true if x is a palindrome, and false otherwise.`,
    difficulty: "easy",
    tags: ["math"],
    category: "algorithm",
    inputFormat: "Single integer x",
    outputFormat: "true or false",
    sampleInput: ["121"],
    sampleOutput: ["true"],
    sampleExplanation: ["121 reads the same backward"],
    testCases: [
      { input: "121", expectedOutput: "true", isHidden: false },
      { input: "-121", expectedOutput: "false", isHidden: false },
      { input: "12321", expectedOutput: "true", isHidden: true }
    ],
    hints: [{ title: "Reverse Number", content: "Reverse the number and compare", order: 1 }],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: { isPublished: true, views: 20123, submissions: 15678, likes: 4123, dislikes: 567, bookmarks: 2012 }
  },
  {
    title: "Word Search",
    description: `Given an m x n grid and a string word, return true if word exists in the grid. The word can be constructed from sequentially adjacent cells.`,
    difficulty: "medium",
    tags: ["array", "backtracking"],
    category: "algorithm",
    inputFormat: "First line: m n\\nNext m lines: n characters\\nLast line: word",
    outputFormat: "true or false",
    sampleInput: ["3 4\\nA B C E\\nS F C S\\nA D E E\\nABCCED"],
    sampleOutput: ["true"],
    sampleExplanation: ["ABCCED can be formed in the grid"],
    testCases: [
      { input: "3 4\\nA B C E\\nS F C S\\nA D E E\\nABCCED", expectedOutput: "true", isHidden: false },
      { input: "3 4\\nA B C E\\nS F C S\\nA D E E\\nSEE", expectedOutput: "true", isHidden: false },
      { input: "3 4\\nA B C E\\nS F C S\\nA D E E\\nABCB", expectedOutput: "false", isHidden: true }
    ],
    hints: [{ title: "Backtracking", content: "Use DFS with backtracking", order: 1 }],
    constraints: { timeLimit: 3000, memoryLimit: 256 },
    metadata: { isPublished: true, views: 9456, submissions: 4123, likes: 1987, dislikes: 234, bookmarks: 876 }
  },
  {
    title: "Kth Largest Element",
    description: `Given an array nums and integer k, return the kth largest element in the array.`,
    difficulty: "medium",
    tags: ["array", "heap", "sorting"],
    category: "algorithm",
    inputFormat: "First line: n k\\nSecond line: n space-separated integers",
    outputFormat: "Single integer (kth largest)",
    sampleInput: ["6 2\\n3 2 1 5 6 4"],
    sampleOutput: ["5"],
    sampleExplanation: ["After sorting: [1,2,3,4,5,6], 2nd largest is 5"],
    testCases: [
      { input: "6 2\\n3 2 1 5 6 4", expectedOutput: "5", isHidden: false },
      { input: "9 4\\n3 2 3 1 2 4 5 5 6", expectedOutput: "4", isHidden: false },
      { input: "5 1\\n5 4 3 2 1", expectedOutput: "5", isHidden: true }
    ],
    hints: [{ title: "Quick Select", content: "Use quickselect for O(n) average time", order: 1 }],
    constraints: { timeLimit: 2000, memoryLimit: 256 },
    metadata: { isPublished: true, views: 11234, submissions: 6789, likes: 2456, dislikes: 178, bookmarks: 1123 }
  },
  {
    title: "Product of Array Except Self",
    description: `Given array nums, return array answer where answer[i] equals the product of all elements except nums[i]. Do it in O(n) time without division.`,
    difficulty: "medium",
    tags: ["array"],
    category: "algorithm",
    inputFormat: "First line: n\\nSecond line: n space-separated integers",
    outputFormat: "n space-separated integers",
    sampleInput: ["4\\n1 2 3 4"],
    sampleOutput: ["24 12 8 6"],
    sampleExplanation: ["[2*3*4, 1*3*4, 1*2*4, 1*2*3]"],
    testCases: [
      { input: "4\\n1 2 3 4", expectedOutput: "24 12 8 6", isHidden: false },
      { input: "5\\n-1 1 0 -3 3", expectedOutput: "0 0 9 0 0", isHidden: false },
      { input: "3\\n2 3 4", expectedOutput: "12 8 6", isHidden: true }
    ],
    hints: [{ title: "Prefix and Suffix", content: "Calculate prefix and suffix products", order: 1 }],
    constraints: { timeLimit: 2000, memoryLimit: 256 },
    metadata: { isPublished: true, views: 12987, submissions: 7654, likes: 3210, dislikes: 289, bookmarks: 1456 }
  },
  {
    title: "Binary Search",
    description: `Given a sorted array and a target value, return the index if found, or -1 if not found. Must run in O(log n) time.`,
    difficulty: "easy",
    tags: ["array", "binary-search"],
    category: "algorithm",
    inputFormat: "First line: n target\\nSecond line: n sorted integers",
    outputFormat: "Index of target or -1",
    sampleInput: ["5 7\\n1 3 5 7 9"],
    sampleOutput: ["3"],
    sampleExplanation: ["7 is at index 3"],
    testCases: [
      { input: "5 7\\n1 3 5 7 9", expectedOutput: "3", isHidden: false },
      { input: "5 6\\n1 3 5 7 9", expectedOutput: "-1", isHidden: false },
      { input: "10 15\\n1 3 5 7 9 11 13 15 17 19", expectedOutput: "7", isHidden: true }
    ],
    hints: [{ title: "Divide and Conquer", content: "Eliminate half the array each iteration", order: 1 }],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: { isPublished: true, views: 18234, submissions: 14567, likes: 4567, dislikes: 123, bookmarks: 2345 }
  },
  {
    title: "Merge Sorted Arrays",
    description: `You are given two sorted arrays nums1 and nums2. Merge nums2 into nums1 as one sorted array in-place.`,
    difficulty: "easy",
    tags: ["array", "two-pointers", "sorting"],
    category: "algorithm",
    inputFormat: "First line: m n\\nSecond line: m integers (nums1)\\nThird line: n integers (nums2)",
    outputFormat: "m+n sorted integers",
    sampleInput: ["3 3\\n1 2 3\\n2 5 6"],
    sampleOutput: ["1 2 2 3 5 6"],
    sampleExplanation: ["Merge both arrays maintaining sorted order"],
    testCases: [
      { input: "3 3\\n1 2 3\\n2 5 6", expectedOutput: "1 2 2 3 5 6", isHidden: false },
      { input: "1 0\\n1\\n", expectedOutput: "1", isHidden: false },
      { input: "4 4\\n1 3 5 7\\n2 4 6 8", expectedOutput: "1 2 3 4 5 6 7 8", isHidden: true }
    ],
    hints: [{ title: "Two Pointers", content: "Start from the end of both arrays", order: 1 }],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: { isPublished: true, views: 15678, submissions: 11234, likes: 3456, dislikes: 234, bookmarks: 1789 }
  },
  {
    title: "Container With Most Water",
    description: `Given n non-negative integers representing heights of vertical lines, find two lines that together with x-axis form a container that holds the most water.`,
    difficulty: "medium",
    tags: ["array", "two-pointers", "greedy"],
    category: "algorithm",
    inputFormat: "First line: n\\nSecond line: n space-separated heights",
    outputFormat: "Maximum water area",
    sampleInput: ["9\\n1 8 6 2 5 4 8 3 7"],
    sampleOutput: ["49"],
    sampleExplanation: ["Lines at index 1 and 8 hold maximum water"],
    testCases: [
      { input: "9\\n1 8 6 2 5 4 8 3 7", expectedOutput: "49", isHidden: false },
      { input: "2\\n1 1", expectedOutput: "1", isHidden: false },
      { input: "6\\n4 3 2 1 4 5", expectedOutput: "16", isHidden: true }
    ],
    hints: [{ title: "Two Pointers", content: "Start from both ends and move pointers inward", order: 1 }],
    constraints: { timeLimit: 2000, memoryLimit: 256 },
    metadata: { isPublished: true, views: 10987, submissions: 5432, likes: 2789, dislikes: 198, bookmarks: 1234 }
  },
  {
    title: "Group Anagrams",
    description: `Given an array of strings, group the anagrams together. An anagram is a word formed by rearranging letters of another word.`,
    difficulty: "medium",
    tags: ["array", "hash-table", "string", "sorting"],
    category: "algorithm",
    inputFormat: "First line: n\\nNext n lines: one string each",
    outputFormat: "Groups of anagrams (one group per line)",
    sampleInput: ["6\\neat\\ntea\\ntan\\nate\\nnat\\nbat"],
    sampleOutput: ["eat tea ate\\ntan nat\\nbat"],
    sampleExplanation: ["Group words that are anagrams of each other"],
    testCases: [
      { input: "6\\neat\\ntea\\ntan\\nate\\nnat\\nbat", expectedOutput: "eat tea ate\\ntan nat\\nbat", isHidden: false },
      { input: "1\\na", expectedOutput: "a", isHidden: false },
      { input: "3\\nabc\\nbca\\ncab", expectedOutput: "abc bca cab", isHidden: true }
    ],
    hints: [{ title: "Sorting Key", content: "Use sorted string as hash key", order: 1 }],
    constraints: { timeLimit: 2000, memoryLimit: 256 },
    metadata: { isPublished: true, views: 9876, submissions: 4567, likes: 2123, dislikes: 156, bookmarks: 987 }
  },
  {
    title: "Find Minimum in Rotated Sorted Array",
    description: `Suppose a sorted array is rotated at some pivot. Find the minimum element. Array has no duplicates and must run in O(log n).`,
    difficulty: "medium",
    tags: ["array", "binary-search"],
    category: "algorithm",
    inputFormat: "First line: n\\nSecond line: n space-separated integers",
    outputFormat: "Minimum element",
    sampleInput: ["5\\n3 4 5 1 2"],
    sampleOutput: ["1"],
    sampleExplanation: ["The array was [1,2,3,4,5] rotated 3 times"],
    testCases: [
      { input: "5\\n3 4 5 1 2", expectedOutput: "1", isHidden: false },
      { input: "7\\n4 5 6 7 0 1 2", expectedOutput: "0", isHidden: false },
      { input: "5\\n11 13 15 17 19", expectedOutput: "11", isHidden: true }
    ],
    hints: [{ title: "Binary Search", content: "Use modified binary search to find rotation point", order: 1 }],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: { isPublished: true, views: 8765, submissions: 3456, likes: 1890, dislikes: 123, bookmarks: 765 }
  },
  {
    title: "Implement Queue using Stacks",
    description: `Implement a FIFO queue using only two stacks. The queue should support push, pop, peek, and empty operations.`,
    difficulty: "easy",
    tags: ["stack", "queue"],
    category: "algorithm",
    inputFormat: "First line: n (operations)\\nNext n lines: operation and value",
    outputFormat: "Result for each peek/pop operation",
    sampleInput: ["5\\npush 1\\npush 2\\npeek\\npop\\nempty"],
    sampleOutput: ["1\\n1\\nfalse"],
    sampleExplanation: ["Queue operations using two stacks"],
    testCases: [
      { input: "5\\npush 1\\npush 2\\npeek\\npop\\nempty", expectedOutput: "1\\n1\\nfalse", isHidden: false },
      { input: "3\\npush 5\\npeek\\npop", expectedOutput: "5\\n5", isHidden: false },
      { input: "6\\npush 1\\npush 2\\npush 3\\npop\\npop\\npop", expectedOutput: "1\\n2\\n3", isHidden: true }
    ],
    hints: [{ title: "Two Stacks", content: "Use one stack for enqueue and one for dequeue", order: 1 }],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: { isPublished: true, views: 13456, submissions: 8765, likes: 2345, dislikes: 178, bookmarks: 1123 }
  }
];

async function seed() {
  try {
    console.log('🌱 Starting comprehensive database seeding...');
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // FIXED: Clear ALL existing data including Users
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),      // ADDED THIS LINE
      Problem.deleteMany({}),
      Submission.deleteMany({}),
    ]);
    console.log('✓ Cleared existing data (including users)\n');

    // Create admin user
    console.log('Creating admin user...');
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@codejudge.com',
      password: 'admin123',
      role: 'admin',
      isEmailVerified: true,
      isProfileComplete: true
    });
    console.log('✓ Admin user created\n');

    // Create test users
    console.log('👥 Creating test users...');
    const testUsers = [];
    const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    
    for (let i = 1; i <= 50; i++) {
      testUsers.push({
        username: `user${i}`,
        email: `user${i}@test.com`,
        password: await bcrypt.hash('password123', 10),
        role: 'user',
        isActive: true,
        profile: {
          name: `Test User ${i}`,
          bio: `I'm test user number ${i}, passionate about coding and algorithms!`,
          skills: [
            { name: 'JavaScript', level: skillLevels[Math.floor(Math.random() * skillLevels.length)] },
            { name: 'Python', level: skillLevels[Math.floor(Math.random() * skillLevels.length)] }
          ]
        },
        stats: {
          totalSubmissions: Math.floor(Math.random() * 100),
          acceptedSubmissions: Math.floor(Math.random() * 50),
          totalProblemsSolved: Math.floor(Math.random() * 30),
          easySolved: Math.floor(Math.random() * 15),
          mediumSolved: Math.floor(Math.random() * 10),
          hardSolved: Math.floor(Math.random() * 5),
          streak: Math.floor(Math.random() * 30),
          maxStreak: Math.floor(Math.random() * 50),
          rank: i,
          score: Math.floor(Math.random() * 1000) + 100
        }
      });
    }
    
    const createdUsers = await User.insertMany(testUsers);
    console.log(`✓ Created ${createdUsers.length} test users\n`);

    // Seed problems with generated slugs
    console.log('📝 Seeding problems...');
    const problems = [];
    
    for (const problemData of problemsData) {
      const slug = generateSlug(problemData.title);
      problems.push({
        ...problemData,
        slug,
        createdBy: adminUser._id,
        metadata: {
          ...problemData.metadata,
          publishedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
          acceptanceRate: Math.random() * 60 + 20
        }
      });
    }

    const createdProblems = await Problem.insertMany(problems);
    console.log(`✓ Seeded ${createdProblems.length} problems\n`);

    // Create submissions
    console.log('📤 Creating submissions...');
    const submissions = [];
    const verdicts = ['accepted', 'wrong_answer', 'time_limit_exceeded', 'runtime_error', 'compilation_error'];
    const languages = ['python', 'cpp', 'java', 'javascript'];
    
    for (let i = 0; i < 500; i++) {
      const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const problem = createdProblems[Math.floor(Math.random() * createdProblems.length)];
      const verdict = verdicts[Math.floor(Math.random() * verdicts.length)];
      const language = languages[Math.floor(Math.random() * languages.length)];
      
      submissions.push({
        user: user._id,
        problem: problem._id,
        language,
        code: `// Solution in ${language}\nfunction solve() {\n  // Implementation here\n  return result;\n}`,
        verdict,
        runtime: Math.floor(Math.random() * 500) + 50,
        memory: Math.floor(Math.random() * 200) + 50,
        testCasesPassed: verdict === 'accepted' ? problem.testCases.length : Math.floor(Math.random() * problem.testCases.length),
        totalTestCases: problem.testCases.length,
        executionResults: problem.testCases.map((tc, idx) => ({
          testCaseIndex: idx,
          passed: verdict === 'accepted' || Math.random() > 0.5,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: verdict === 'accepted' ? tc.expectedOutput : 'Wrong output',
          runtime: Math.floor(Math.random() * 100),
          memory: Math.floor(Math.random() * 50)
        })),
        createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        executedAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)
      });
    }
    
    await Submission.insertMany(submissions);
    console.log(`✓ Created ${submissions.length} submissions\n`);

    // Update problem stats
    console.log('📊 Updating problem statistics...');
    for (const problem of createdProblems) {
      const problemSubmissions = submissions.filter(s => s.problem.toString() === problem._id.toString());
      const accepted = problemSubmissions.filter(s => s.verdict === 'accepted').length;
      const total = problemSubmissions.length;
      
      problem.metadata.submissions = total;
      problem.metadata.acceptanceRate = total > 0 ? (accepted / total * 100) : 0;
      await problem.save();
    }
    console.log('✓ Updated problem statistics\n');

    // Update user stats
    console.log('👤 Updating user statistics...');
    for (const user of createdUsers) {
      const userSubmissions = submissions.filter(s => s.user.toString() === user._id.toString());
      const acceptedSubs = userSubmissions.filter(s => s.verdict === 'accepted');
      const solvedProblemIds = [...new Set(acceptedSubs.map(s => s.problem.toString()))];
      
      user.stats.totalSubmissions = userSubmissions.length;
      user.stats.acceptedSubmissions = acceptedSubs.length;
      user.stats.totalProblemsSolved = solvedProblemIds.length;
      
      // Update solved and attempted problems
      user.solvedProblems = solvedProblemIds.map(id => ({ 
        problem: id, 
        solvedAt: new Date(),
        firstSolve: true,
        bestRuntime: Math.floor(Math.random() * 500) + 50,
        bestMemory: Math.floor(Math.random() * 200) + 50,
        submissionsCount: Math.floor(Math.random() * 5) + 1
      }));
      
      user.attemptedProblems = userSubmissions.map(s => ({ 
        problem: s.problem, 
        lastAttempt: s.createdAt, 
        attemptsCount: Math.floor(Math.random() * 3) + 1,
        solved: s.verdict === 'accepted'
      }));
      
      // Random bookmarks
      if (Math.random() > 0.5) {
        const randomProblem = createdProblems[Math.floor(Math.random() * createdProblems.length)];
        user.bookmarks = [randomProblem._id];
      }
      
      await user.save();
    }
    console.log('✓ Updated user statistics\n');

    console.log('🎉 Seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Problems: ${createdProblems.length}`);
    console.log(`   • Users: ${createdUsers.length + 1} (including admin)`);
    console.log(`   • Submissions: ${submissions.length}`);
    console.log('\n✅ Test Credentials:');
    console.log('   Admin: admin@codejudge.com / admin123');
    console.log('   Users: user1@test.com - user50@test.com / password123');
    console.log('\n✓ Database is ready!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error('\nError details:', error.message);
    if (error.errors) {
      console.error('Validation errors:', Object.keys(error.errors));
    }
    process.exit(1);
  }
}

seed();