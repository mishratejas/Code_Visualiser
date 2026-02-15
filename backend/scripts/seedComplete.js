import mongoose from 'mongoose';
import Problem from '../src/models/problem.models.js';
import User from '../src/models/user.models.js';
import Submission from '../src/models/submission.models.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

// Use the existing URI or default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codejudge';

// Helper to generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Standard problems list
const problemsData = [
  {
    title: "Two Sum",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    difficulty: "easy",
    tags: ["array", "hash-table"],
    category: "algorithm",
    inputFormat: "First line contains n (number of elements)\nSecond line contains n space-separated integers\nThird line contains target integer",
    outputFormat: "Two space-separated integers representing the indices",
    sampleInput: ["4\n2 7 11 15\n9"],
    sampleOutput: ["0 1"],
    sampleExplanation: ["nums[0] + nums[1] = 2 + 7 = 9, so we return [0, 1]"],
    testCases: [
      { input: "4\n2 7 11 15\n9", expectedOutput: "0 1", isHidden: false },
      { input: "3\n3 2 4\n6", expectedOutput: "1 2", isHidden: false },
      { input: "2\n3 3\n6", expectedOutput: "0 1", isHidden: false },
      { input: "5\n1 5 3 7 8\n10", expectedOutput: "1 3", isHidden: true },
      { input: "6\n-1 -2 -3 -4 -5\n-8", expectedOutput: "2 4", isHidden: true }
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
    description: "Write a function that reverses a string. The input string is given as an array of characters.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.",
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
      title: "Sort Colors",
      description: "Given an array distinct integers [2,0,2,1,1,0], sort the array in ascending order.\n\nWe will use the integers 0, 1, and 2 to represent the color red, white, and blue, respectively.\n\nYou must solve this problem without using the library's sort function.",
      difficulty: "medium",
      tags: ["array", "two-pointers", "sorting"],
      category: "algorithm",
      inputFormat: "First line contains n elements\nSecond line contains n space-separated integers",
      outputFormat: "Sorted space-separated integers",
      sampleInput: ["6\n2 0 2 1 1 0"],
      sampleOutput: ["0 0 1 1 2 2"],
      sampleExplanation: ["The sorted array is [0, 0, 1, 1, 2, 2]"],
      testCases: [
          { input: "6\n2 0 2 1 1 0", expectedOutput: "0 0 1 1 2 2", isHidden: false },
          { input: "1\n2", expectedOutput: "2", isHidden: false },
          { input: "2\n1 0", expectedOutput: "0 1", isHidden: false }
      ],
      hints: [
          { title: "Dutch National Flag", content: "This is the classic Dutch National Flag problem.", order: 1 }
      ],
      constraints: { timeLimit: 1000, memoryLimit: 256 },
      metadata: { isPublished: true, views: 1000, submissions: 500, likes: 200, dislikes: 10, bookmarks: 50 }
  },
   {
    title: "Merge Sorted Arrays",
    description: "You are given two sorted arrays nums1 and nums2. Merge nums2 into nums1 as one sorted array in-place.",
    difficulty: "easy",
    tags: ["array", "two-pointers", "sorting"],
    category: "algorithm",
    inputFormat: "First line: m n\nSecond line: m integers (nums1)\nThird line: n integers (nums2)",
    outputFormat: "m+n sorted integers",
    sampleInput: ["3 3\n1 2 3\n2 5 6"],
    sampleOutput: ["1 2 2 3 5 6"],
    sampleExplanation: ["Merge both arrays maintaining sorted order"],
    testCases: [
      { input: "3 3\n1 2 3\n2 5 6", expectedOutput: "1 2 2 3 5 6", isHidden: false },
      { input: "1 0\n1\n", expectedOutput: "1", isHidden: false },
      { input: "4 4\n1 3 5 7\n2 4 6 8", expectedOutput: "1 2 3 4 5 6 7 8", isHidden: true }
    ],
    hints: [{ title: "Two Pointers", content: "Start from the end of both arrays", order: 1 }],
    constraints: { timeLimit: 1000, memoryLimit: 128 },
    metadata: { isPublished: true, views: 15678, submissions: 11234, likes: 3456, dislikes: 234, bookmarks: 1789 }
  },
  {
      title: "Trapping Rain Water",
      description: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
      difficulty: "hard",
      tags: ["array", "two-pointers", "stack"],
      category: "algorithm",
      inputFormat: "First line: n (size)\nSecond line: n space-separated integers (heights)",
      outputFormat: "Single integer (units of trapped water)",
      sampleInput: ["12\n0 1 0 2 1 0 1 3 2 1 2 1"],
      sampleOutput: ["6"],
      sampleExplanation: ["The elevation map traps 6 units of rain water"],
      testCases: [
        { input: "12\n0 1 0 2 1 0 1 3 2 1 2 1", expectedOutput: "6", isHidden: false },
        { input: "6\n4 2 0 3 2 5", expectedOutput: "9", isHidden: false },
        { input: "1\n5", expectedOutput: "0", isHidden: true }
      ],
      hints: [{ title: "Two Pointers", content: "Use two pointers from both ends", order: 1 }],
      constraints: { timeLimit: 3000, memoryLimit: 256 },
      metadata: { isPublished: true, views: 8923, submissions: 2456, likes: 5678, dislikes: 234, bookmarks: 2345 }
    }
];

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // ================== USERS ==================
    console.log('👥 Seeding users...');
    
    // Ensure admin exists
    const adminExists = await User.findOne({ email: 'admin@codejudge.com' });
    let adminUser;
    
    if (!adminExists) {
      adminUser = await User.create({
        username: 'admin',
        email: 'admin@codejudge.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        isEmailVerified: true,
        isProfileComplete: true
      });
      console.log('✓ Admin user created');
    } else {
      adminUser = adminExists;
      console.log('✓ Admin user already exists');
    }

    // Create test users (upsert)
    const testUsers = [];
    const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    
    for (let i = 1; i <= 20; i++) {
        const email = `user${i}@test.com`;
        const exists = await User.findOne({ email });
        
        if (!exists) {
            const newUser = await User.create({
                username: `user${i}`,
                email,
                password: await bcrypt.hash('password123', 10),
                role: 'user',
                isActive: true,
                profile: {
                name: `Test User ${i}`,
                bio: `I'm test user number ${i}, passionate about coding!`,
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
            testUsers.push(newUser);
        } else {
            testUsers.push(exists);
        }
    }
    console.log(`✓ Ensure ${testUsers.length} test users exist\n`);

    // ================== PROBLEMS ==================
    console.log('📝 Seeding problems...');
    const problems = [];
    
    for (const problemData of problemsData) {
      const slug = generateSlug(problemData.title);
      
      const existingProblem = await Problem.findOne({ slug });
      
      if (!existingProblem) {
          const newProblem = await Problem.create({
            ...problemData,
            slug,
            createdBy: adminUser._id,
            metadata: {
            ...problemData.metadata,
            publishedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
            acceptanceRate: Math.random() * 60 + 20
            }
        });
        problems.push(newProblem);
      } else {
          problems.push(existingProblem);
      }
    }
    console.log(`✓ Ensure ${problems.length} problems exist\n`);

    // ================== SUBMISSIONS ==================
    // Only create submissions for TEST users to avoid messing up real users
    console.log('📤 Seeding submissions for test users...');
    const verdicts = ['accepted', 'wrong_answer', 'time_limit_exceeded', 'runtime_error'];
    const languages = ['python', 'cpp', 'java', 'javascript'];
    
    let submissionCount = 0;
    
    for (const user of testUsers) {
        // Skip if user already has many submissions
        const existingCount = await Submission.countDocuments({ user: user._id });
        if (existingCount > 5) continue; 

        for (let i = 0; i < 10; i++) {
            const problem = problems[Math.floor(Math.random() * problems.length)];
            const verdict = verdicts[Math.floor(Math.random() * verdicts.length)];
            const language = languages[Math.floor(Math.random() * languages.length)];
            
            await Submission.create({
                user: user._id,
                problem: problem._id,
                language,
                code: `// Solution in ${language}\nfunction solve() {\n  // Automated seed submission\n  return result;\n}`,
                verdict,
                runtime: Math.floor(Math.random() * 500) + 50,
                memory: Math.floor(Math.random() * 200) + 50,
                testCasesPassed: verdict === 'accepted' ? problem.testCases.length : 0,
                totalTestCases: problem.testCases.length,
                executionResults: problem.testCases.map((tc, idx) => ({
                    testCaseIndex: idx,
                    passed: verdict === 'accepted',
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                    actualOutput: verdict === 'accepted' ? tc.expectedOutput : 'Wrong output',
                    runtime: Math.floor(Math.random() * 100),
                    memory: Math.floor(Math.random() * 50)
                })),
                createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
                executedAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)
            });
            submissionCount++;
        }
    }
    console.log(`✓ Created ${submissionCount} new submissions\n`);

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
