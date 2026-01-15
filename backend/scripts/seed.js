import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Problem from '../src/models/Problem.js';
import User from '../src/models/User.js';

// Load environment variables
dotenv.config();

const sampleProblems = [
  {
    title: "Two Sum",
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]`,
    difficulty: "easy",
    tags: ["array", "hash-table"],
    testCases: [
      { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" },
      { input: "[3,2,4]\n6", expectedOutput: "[1,2]" }
    ],
    constraints: {
      timeLimit: 2000,
      memoryLimit: 256
    }
  },
  {
    title: "Reverse String",
    description: `Write a function that reverses a string. The input string is given as an array of characters s.`,
    difficulty: "easy",
    tags: ["string", "two-pointers"],
    testCases: [
      { input: "['h','e','l','l','o']", expectedOutput: "['o','l','l','e','h']" },
      { input: "['H','a','n','n','a','h']", expectedOutput: "['h','a','n','n','a','H']" }
    ],
    constraints: {
      timeLimit: 1000,
      memoryLimit: 128
    }
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/code-visualiser';
    console.log('Connecting to:', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    console.log('Clearing old data...');
    await Problem.deleteMany({});
    await User.deleteMany({});
    console.log('✅ Cleared existing data');
    
    // Create admin user
    console.log('Creating admin user...');
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      profile: {
        name: 'Admin User'
      }
    });
    console.log(`✅ Created admin: ${adminUser.username} (admin@example.com / admin123)`);
    
    // Create regular user
    console.log('Creating demo user...');
    const userPassword = await bcrypt.hash('demo123', salt);
    const demoUser = await User.create({
      username: 'demo',
      email: 'demo@example.com',
      password: userPassword,
      role: 'user',
      profile: {
        name: 'Demo User'
      }
    });
    console.log(`✅ Created user: ${demoUser.username} (demo@example.com / demo123)`);
    
    // Create sample problems
    console.log('Creating sample problems...');
    const problems = sampleProblems.map(problem => ({
      ...problem,
      createdBy: adminUser._id,
      metadata: {
        isPublished: true,
        publishedAt: new Date()
      }
    }));
    
    const createdProblems = await Problem.insertMany(problems);
    console.log(`✅ Created ${createdProblems.length} problems:`);
    createdProblems.forEach(p => console.log(`   - ${p.title} (${p.difficulty})`));
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('   Admin: admin@example.com / admin123');
    console.log('   User:  demo@example.com / demo123');
    console.log('\n🚀 Start your server: npm run dev');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();