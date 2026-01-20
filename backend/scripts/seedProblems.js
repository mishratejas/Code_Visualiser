import mongoose from 'mongoose';
import Problem from '../src/models/problem.models.js';
import User from '../src/models/user.models.js';
import dotenv from 'dotenv';

dotenv.config();

const problems = [
  {
    title: "Two Sum",
    slug: "two-sum",
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.`,
    difficulty: "easy",
    tags: ["array", "hash-table"],
    inputFormat: "n\\n nums\\n target",
    outputFormat: "i j",
    testCases: [
      { input: "4\\n2 7 11 15\\n9", expectedOutput: "0 1", isHidden: false },
      { input: "3\\n3 2 4\\n6", expectedOutput: "1 2", isHidden: false }
    ]
  },
  {
    title: "Reverse Integer",
    slug: "reverse-integer",
    description: `Given a signed 32-bit integer x, return x with its digits reversed.`,
    difficulty: "easy",
    tags: ["math"],
    inputFormat: "x",
    outputFormat: "reversed",
    testCases: [
      { input: "123", expectedOutput: "321", isHidden: false },
      { input: "-123", expectedOutput: "-321", isHidden: false }
    ]
  },
  {
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.`,
    difficulty: "easy",
    tags: ["string", "stack"],
    inputFormat: "s",
    outputFormat: "true/false",
    testCases: [
      { input: "()", expectedOutput: "true", isHidden: false },
      { input: "(]", expectedOutput: "false", isHidden: false }
    ]
  },
  {
    title: "Maximum Subarray",
    slug: "maximum-subarray",
    description: `Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum.`,
    difficulty: "medium",
    tags: ["array", "dynamic-programming"],
    inputFormat: "n\\n nums",
    outputFormat: "sum",
    testCases: [
      { input: "9\\n-2 1 -3 4 -1 2 1 -5 4", expectedOutput: "6", isHidden: false }
    ]
  },
  {
    title: "Binary Tree Inorder Traversal",
    slug: "binary-tree-inorder-traversal",
    description: `Given the root of a binary tree, return the inorder traversal of its nodes' values.`,
    difficulty: "easy",
    tags: ["tree", "recursion"],
    inputFormat: "tree array",
    outputFormat: "traversal",
    testCases: [
      { input: "[1,null,2,3]", expectedOutput: "[1,3,2]", isHidden: false }
    ]
  },
  {
    title: "Climbing Stairs",
    slug: "climbing-stairs",
    description: `You are climbing a staircase. It takes n steps to reach the top.`,
    difficulty: "easy",
    tags: ["dynamic-programming", "math"],
    inputFormat: "n",
    outputFormat: "ways",
    testCases: [
      { input: "2", expectedOutput: "2", isHidden: false },
      { input: "3", expectedOutput: "3", isHidden: false }
    ]
  },
  {
    title: "Best Time to Buy and Sell Stock",
    slug: "best-time-to-buy-and-sell-stock",
    description: `Maximize profit by choosing when to buy and sell stock.`,
    difficulty: "easy",
    tags: ["array", "dynamic-programming"],
    inputFormat: "n\\n prices",
    outputFormat: "max profit",
    testCases: [
      { input: "6\\n7 1 5 3 6 4", expectedOutput: "5", isHidden: false }
    ]
  },
  {
    title: "Single Number",
    slug: "single-number",
    description: `Every element appears twice except for one. Find that single one.`,
    difficulty: "easy",
    tags: ["array", "bit-manipulation"],
    inputFormat: "n\\n nums",
    outputFormat: "single number",
    testCases: [
      { input: "5\\n4 1 2 1 2", expectedOutput: "4", isHidden: false }
    ]
  },
  {
    title: "Linked List Cycle",
    slug: "linked-list-cycle",
    description: `Determine if a linked list has a cycle.`,
    difficulty: "easy",
    tags: ["linked-list", "two-pointers"],
    inputFormat: "list\\n pos",
    outputFormat: "true/false",
    testCases: [
      { input: "[3,2,0,-4]\\n1", expectedOutput: "true", isHidden: false }
    ]
  },
  {
    title: "First Bad Version",
    slug: "first-bad-version",
    description: `Find the first bad version using binary search.`,
    difficulty: "easy",
    tags: ["binary-search"],
    inputFormat: "n\\n bad",
    outputFormat: "first bad",
    testCases: [
      { input: "5\\n4", expectedOutput: "4", isHidden: false }
    ]
  },
  {
    title: "Ransom Note",
    slug: "ransom-note",
    description: `Check if ransom note can be constructed from magazine.`,
    difficulty: "easy",
    tags: ["string", "hash-table"],
    inputFormat: "ransomNote\\n magazine",
    outputFormat: "true/false",
    testCases: [
      { input: "aa\\naab", expectedOutput: "true", isHidden: false }
    ]
  },
  {
    title: "Longest Common Prefix",
    slug: "longest-common-prefix",
    description: `Find the longest common prefix string amongst an array of strings.`,
    difficulty: "easy",
    tags: ["string"],
    inputFormat: "n\\n strings",
    outputFormat: "prefix",
    testCases: [
      { input: "3\\nflower flow flight", expectedOutput: "fl", isHidden: false }
    ]
  },
  {
    title: "Valid Palindrome",
    slug: "valid-palindrome",
    description: `Check if a string is a palindrome after converting to lowercase and removing non-alphanumeric characters.`,
    difficulty: "easy",
    tags: ["string", "two-pointers"],
    inputFormat: "s",
    outputFormat: "true/false",
    testCases: [
      { input: "A man, a plan, a canal: Panama", expectedOutput: "true", isHidden: false }
    ]
  },
  {
    title: "Intersection of Two Arrays",
    slug: "intersection-of-two-arrays",
    description: `Find the intersection of two arrays.`,
    difficulty: "easy",
    tags: ["array", "hash-table"],
    inputFormat: "n1\\n nums1\\n n2\\n nums2",
    outputFormat: "intersection",
    testCases: [
      { input: "4\\n1 2 2 1\\n2\\n2 2", expectedOutput: "2", isHidden: false }
    ]
  },
  {
    title: "Missing Number",
    slug: "missing-number",
    description: `Find the missing number in an array containing n distinct numbers from 0 to n.`,
    difficulty: "easy",
    tags: ["array", "math"],
    inputFormat: "n\\n nums",
    outputFormat: "missing",
    testCases: [
      { input: "3\\n0 1 3", expectedOutput: "2", isHidden: false }
    ]
  },
  {
    title: "Move Zeroes",
    slug: "move-zeroes",
    description: `Move all zeroes to the end while maintaining relative order of non-zero elements.`,
    difficulty: "easy",
    tags: ["array", "two-pointers"],
    inputFormat: "n\\n nums",
    outputFormat: "modified array",
    testCases: [
      { input: "5\\n0 1 0 3 12", expectedOutput: "1 3 12 0 0", isHidden: false }
    ]
  },
  {
    title: "Reverse String",
    slug: "reverse-string",
    description: `Reverse a string in-place.`,
    difficulty: "easy",
    tags: ["string", "two-pointers"],
    inputFormat: "s",
    outputFormat: "reversed",
    testCases: [
      { input: "hello", expectedOutput: "olleh", isHidden: false }
    ]
  },
  {
    title: "Majority Element",
    slug: "majority-element",
    description: `Find the element that appears more than ⌊n/2⌋ times.`,
    difficulty: "easy",
    tags: ["array", "sorting"],
    inputFormat: "n\\n nums",
    outputFormat: "majority",
    testCases: [
      { input: "7\\n2 2 1 1 1 2 2", expectedOutput: "2", isHidden: false }
    ]
  },
  {
    title: "Contains Duplicate",
    slug: "contains-duplicate",
    description: `Check if array contains duplicate elements.`,
    difficulty: "easy",
    tags: ["array", "hash-table"],
    inputFormat: "n\\n nums",
    outputFormat: "true/false",
    testCases: [
      { input: "4\\n1 2 3 1", expectedOutput: "true", isHidden: false }
    ]
  },
  {
    title: "Rotate Array",
    slug: "rotate-array",
    description: `Rotate array to the right by k steps.`,
    difficulty: "medium",
    tags: ["array"],
    inputFormat: "n\\n nums\\n k",
    outputFormat: "rotated array",
    testCases: [
      { input: "7\\n1 2 3 4 5 6 7\\n3", expectedOutput: "5 6 7 1 2 3 4", isHidden: false }
    ]
  },
  {
    title: "Product of Array Except Self",
    slug: "product-of-array-except-self",
    description: `Return array where each element is product of all numbers except itself.`,
    difficulty: "medium",
    tags: ["array"],
    inputFormat: "n\\n nums",
    outputFormat: "product array",
    testCases: [
      { input: "4\\n1 2 3 4", expectedOutput: "24 12 8 6", isHidden: false }
    ]
  },
  {
    title: "3Sum",
    slug: "3sum",
    description: `Find all triplets that sum to zero.`,
    difficulty: "medium",
    tags: ["array", "two-pointers"],
    inputFormat: "n\\n nums",
    outputFormat: "triplets",
    testCases: [
      { input: "6\\n-1 0 1 2 -1 -4", expectedOutput: "[[-1,-1,2],[-1,0,1]]", isHidden: false }
    ]
  },
  {
    title: "Container With Most Water",
    slug: "container-with-most-water",
    description: `Find two lines that together with x-axis forms container containing most water.`,
    difficulty: "medium",
    tags: ["array", "two-pointers"],
    inputFormat: "n\\n height",
    outputFormat: "max area",
    testCases: [
      { input: "9\\n1 8 6 2 5 4 8 3 7", expectedOutput: "49", isHidden: false }
    ]
  },
  {
    title: "Search in Rotated Sorted Array",
    slug: "search-in-rotated-sorted-array",
    description: `Search target in rotated sorted array.`,
    difficulty: "medium",
    tags: ["array", "binary-search"],
    inputFormat: "n\\n nums\\n target",
    outputFormat: "index",
    testCases: [
      { input: "7\\n4 5 6 7 0 1 2\\n0", expectedOutput: "4", isHidden: false }
    ]
  },
  {
    title: "Merge Intervals",
    slug: "merge-intervals",
    description: `Merge overlapping intervals.`,
    difficulty: "medium",
    tags: ["array", "sorting"],
    inputFormat: "n\\n intervals",
    outputFormat: "merged",
    testCases: [
      { input: "4\\n1 3 2 6 8 10 15 18", expectedOutput: "[[1,6],[8,10],[15,18]]", isHidden: false }
    ]
  }
];

const seedProblems = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Find any user
    let user = await User.findOne();
    
    if (!user) {
      console.log('No user found, creating default user...');
      user = await User.create({
        username: 'admin',
        email: 'admin@codevisualizer.com',
        password: 'Admin@123',
        role: 'admin',
        isActive: true,
        isEmailVerified: true
      });
      console.log('✅ Default user created');
    }

    console.log('Clearing existing problems...');
    await Problem.deleteMany({});
    console.log('✅ Problems cleared');

    console.log('Seeding problems...');
    
    const problemsWithCreator = problems.map((problem, index) => ({
      ...problem,
      createdBy: user._id,
      updatedBy: user._id,
      metadata: {
        isPublished: true,
        publishedAt: new Date(),
        views: Math.floor(Math.random() * 1000) + 100,
        submissions: Math.floor(Math.random() * 500) + 50,
        acceptanceRate: Math.floor(Math.random() * 50) + 30, // 30-80%
        likes: Math.floor(Math.random() * 100) + 10,
        dislikes: Math.floor(Math.random() * 20),
        bookmarks: Math.floor(Math.random() * 50),
        avgRuntime: Math.floor(Math.random() * 500) + 100,
        avgMemory: Math.floor(Math.random() * 100) + 16
      }
    }));

    await Problem.insertMany(problemsWithCreator);
    
    const count = await Problem.countDocuments();
    console.log(`✅ ${count} problems seeded successfully!`);
    
    // Print sample of seeded problems
    console.log('\n📋 Sample of seeded problems:');
    const sampleProblems = await Problem.find().select('title difficulty tags').limit(5);
    sampleProblems.forEach(p => {
      console.log(`  • ${p.title} (${p.difficulty}) - ${p.tags.join(', ')}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding problems:', error.message);
    if (error.errors) {
      Object.entries(error.errors).forEach(([key, err]) => {
        console.error(`  ${key}: ${err.message} (value: ${err.value})`);
      });
    }
    process.exit(1);
  }
};

seedProblems();