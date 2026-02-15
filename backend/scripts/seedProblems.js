// publishAllProblems.js - Quick fix to mark all problems as published
// Location: backend/scripts/publishAllProblems.js
// Run: node scripts/publishAllProblems.js

import mongoose from 'mongoose';
import Problem from '../src/models/problem.models.js';
import dotenv from 'dotenv';

dotenv.config();

const publishAllProblems = async () => {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    console.log('📝 Updating all problems to published...');
    
    const result = await Problem.updateMany(
      {}, // Update all problems
      {
        $set: {
          'metadata.isPublished': true,
          'metadata.publishedAt': new Date()
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} problems`);
    
    // Verify
    const publishedCount = await Problem.countDocuments({
      'metadata.isPublished': true
    });
    
    console.log(`✅ Total published problems: ${publishedCount}`);
    
    // Show some examples
    const examples = await Problem.find({
      'metadata.isPublished': true
    }).select('title metadata.isPublished').limit(5);
    
    console.log('\n📋 Example problems:');
    examples.forEach(p => {
      console.log(`  • ${p.title} - Published: ${p.metadata.isPublished}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

publishAllProblems();