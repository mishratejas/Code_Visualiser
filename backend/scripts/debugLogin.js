/**
 * Debug login — run this to diagnose and fix password issues.
 * Usage: node scripts/debugLogin.js
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/user.models.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codeforge';
const TEST_PASSWORD = 'Test1234!';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected\n');

  // Step 1: Check what users exist
  const users = await User.find({}).select('username email').limit(5);
  console.log('📋 Users in DB:');
  users.forEach(u => console.log(`  ${u.email}`));

  // Step 2: Try to find alice and inspect her stored hash
  const alice = await User.findOne({ email: 'alice@example.com' }).select('+password');
  if (alice) {
    console.log('\n🔍 Found alice, stored hash:', alice.password?.substring(0, 30) + '...');
    const check1 = await alice.comparePassword(TEST_PASSWORD);
    const check2 = await alice.comparePassword('Password123!');
    console.log(`  comparePassword("${TEST_PASSWORD}") =>`, check1);
    console.log(`  comparePassword("Password123!") =>`, check2);
  } else {
    console.log('\n⚠️  alice not found — DB may be empty. Run seed first.');
  }

  // Step 3: Create a fresh test user via User.create() so we know it definitely works
  await User.deleteOne({ email: 'fresh@test.com' });
  const fresh = await User.create({
    username: 'freshtest',
    email: 'fresh@test.com',
    password: TEST_PASSWORD,
    isEmailVerified: true,
    isActive: true,
  });
  console.log('\n✅ Fresh user created via User.create()');
  const freshCheck = await fresh.comparePassword(TEST_PASSWORD);
  console.log(`  comparePassword("${TEST_PASSWORD}") =>`, freshCheck);
  
  if (freshCheck) {
    console.log('\n🎉 Password system works. Your DB users may have been seeded with the wrong password.');
    console.log('   Solution: Re-run the seed script (node scripts/seedComplete.js)');
    console.log(`   Then login with: fresh@test.com / ${TEST_PASSWORD}`);
  } else {
    console.log('\n❌ Password system broken — bcrypt compare failing. Check bcrypt import.');
  }

  await mongoose.disconnect();
  process.exit(0);
}
run().catch(err => { console.error('❌', err.message); process.exit(1); });