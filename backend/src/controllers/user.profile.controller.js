/**
 * user.profile.controller.js — profile identity & avatar endpoints.
 *
 * M4 fix: split out of user.controller.js (811 lines mixing profile,
 * settings, and stats/activity concerns — audit finding M4). This file
 * covers "who is this user" — avatar and profile fields.
 */
import User from '../models/user.models.js';
import Submission from '../models/submission.models.js';
import Problem from '../models/problem.models.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

// Must configure here — this controller imports cloudinary directly
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// Avatar upload endpoint
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('Please upload an image');
  }

  // Upload to Cloudinary
  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'codeforge/avatars',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto' }
        ]
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(req.file.buffer);
  });

  // Delete old avatar from Cloudinary if exists
  if (req.user.avatar && req.user.avatar.includes('cloudinary')) {
    const publicId = req.user.avatar.split('/').slice(-2).join('/').split('.')[0];
    await cloudinary.uploader.destroy(publicId);
  }

  // Update user in DB directly — req.user is a plain object (toObject()), not a Mongoose doc
  await User.findByIdAndUpdate(req.user._id, { 'profile.avatar': result.secure_url });

  res.status(200).json(
    ApiResponse.success({ avatarUrl: result.secure_url }, 'Avatar uploaded successfully')
  );
});

// Delete avatar
export const deleteAvatar = asyncHandler(async (req, res) => {
  if (req.user.avatar && req.user.avatar.includes('cloudinary')) {
    const publicId = req.user.avatar.split('/').slice(-2).join('/').split('.')[0];
    await cloudinary.uploader.destroy(publicId);
  }

  await User.findByIdAndUpdate(req.user._id, { 'profile.avatar': '' });

  res.status(200).json(
    ApiResponse.success({}, 'Avatar deleted successfully')
  );
});

// @desc    Get user profile by ID or username
// @route   GET /api/v1/users/:identifier
// @access  Public (with limited info) / Private (full info for self)
export const getUserProfile = asyncHandler(async (req, res) => {
  // When called from GET /me/profile there is no :identifier param — fall back to
  // the authenticated user's own ID so the route doesn't 404.
  const { identifier } = req.params;
  const resolvedId = identifier || req.user?._id?.toString();

  console.log('\u{1F50D} Getting user profile for:', resolvedId);

  const isObjectId = mongoose.Types.ObjectId.isValid(resolvedId);
  const query = isObjectId ? { _id: resolvedId } : { username: resolvedId };
  
  console.log('Query:', query);
  
  // Select fields based on who's viewing
  // If no :identifier param (e.g. /me/profile), viewer is always viewing themselves
  const isSelfViewing = !identifier || (req.user && (
    (isObjectId && req.user._id.toString() === resolvedId) ||
    (!isObjectId && req.user?.username === resolvedId)
  ));
  
  const selectFields = isSelfViewing 
    ? '-password -security.twoFactorSecret'
    : 'username profile.name profile.avatar profile.bio profile.country profile.university profile.github profile.linkedin profile.website stats role isProfileComplete createdAt';
  
  console.log('Select fields:', selectFields);
  
  const user = await User.findOne(query).select(selectFields);
  
  if (!user) {
    console.log('❌ User not found:', identifier);
    throw ApiError.notFound('User not found');
  }
  
  console.log('✅ Found user:', user.username);
  
  // Get user's recent activity
  const recentSubmissions = await Submission.find({ user: user._id })
    .populate('problem', 'title slug difficulty')
    .select('verdict runtime language createdAt')
    .sort({ createdAt: -1 })
    .limit(5);
  
  // Get solved problems count by difficulty
  const solvedStats = await Submission.aggregate([
    { $match: { 
      user: user._id, 
      verdict: 'accepted' 
    }},
    { $lookup: {
      from: 'problems',
      localField: 'problem',
      foreignField: '_id',
      as: 'problem'
    }},
    { $unwind: '$problem' },
    { $group: {
      _id: '$problem.difficulty',
      count: { $addToSet: '$problem._id' }
    }},
    { $project: {
      difficulty: '$_id',
      count: { $size: '$count' },
      _id: 0
    }}
  ]);
  
  // Prepare response - FIXED: Use safe object handling
  const response = {
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      profile: user.profile || {},
      stats: user.stats || {},
      role: user.role,
      isProfileComplete: user.isProfileComplete,
      createdAt: user.createdAt
    },
    stats: {
      recentSubmissions,
      solvedByDifficulty: solvedStats.reduce((acc, curr) => {
        acc[curr.difficulty] = curr.count;
        return acc;
      }, { easy: 0, medium: 0, hard: 0 })
    }
  };
  
  // Add additional info if viewing own profile
  if (isSelfViewing) {
    // Get bookmarked problems
    const bookmarks = await Problem.find({ _id: { $in: user.bookmarks || [] } })
      .select('title slug difficulty')
      .limit(10);
    
    // Get attempted but unsolved problems
    const attemptedUnsolved = await Problem.find({ 
      _id: { 
        $in: (user.attemptedProblems || [])
          .filter(ap => !ap.solved)
          .map(ap => ap.problem)
      }
    })
    .select('title slug difficulty')
    .limit(10);
    
    response.additionalInfo = {
      bookmarks,
      attemptedUnsolved,
      preferences: user.preferences || {},
      security: {
        twoFactorEnabled: user.security?.twoFactorEnabled || false,
        lastLogin: user.security?.lastLogin || null
      }
    };
  }
  
  console.log('✅ Sending user profile response');
  
  res.status(200).json(
    ApiResponse.success(response, 'User profile fetched successfully')
  );
});

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { 
    name, 
    bio, 
    country, 
    university, 
    graduationYear,
    github,
    linkedin,
    website,
    skills 
  } = req.body;
  
  const updateData = {};
  
  // Build update object
  if (name !== undefined) updateData['profile.name'] = name;
  if (bio !== undefined) updateData['profile.bio'] = bio;
  if (country !== undefined) updateData['profile.country'] = country;
  if (university !== undefined) updateData['profile.university'] = university;
  if (graduationYear !== undefined) updateData['profile.graduationYear'] = graduationYear;
  if (github !== undefined) updateData['profile.github'] = github;
  if (linkedin !== undefined) updateData['profile.linkedin'] = linkedin;
  if (website !== undefined) updateData['profile.website'] = website;
  
  // Handle skills update
  if (skills && Array.isArray(skills)) {
    updateData['profile.skills'] = skills.map(skill => ({
      name: skill.name,
      level: skill.level || 'intermediate'
    }));
  }
  
  // Mark profile as complete if enough info
  const requiredFields = ['profile.name', 'profile.bio', 'profile.country'];
  const hasRequiredFields = requiredFields.every(field => {
    const keys = field.split('.');
    let value = updateData;
    keys.forEach(key => {
      if (value && typeof value === 'object') {
        value = value[key];
      }
    });
    return value !== undefined && value !== '';
  });
  
  if (hasRequiredFields) {
    updateData.isProfileComplete = true;
  }
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password -security.twoFactorSecret');
  
  res.status(200).json(
    ApiResponse.success({ user }, 'Profile updated successfully')
  );
});