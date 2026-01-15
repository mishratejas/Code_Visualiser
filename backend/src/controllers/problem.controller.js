import Problem from '../models/problem.models.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import mongoose from 'mongoose';

// @desc    Get all published problems with pagination
// @route   GET /api/v1/problems
// @access  Public
export const getAllProblems = asyncHandler(async (req, res) => {
  const { 
    difficulty, 
    tags, 
    page = 1, 
    limit = 20, 
    sort = '-createdAt',
    search = ''
  } = req.query;
  
  // Build filter
  const filter = { 'metadata.isPublished': true };
  
  if (difficulty) filter.difficulty = difficulty;
  if (tags) filter.tags = { $in: tags.split(',') };
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit) > 50 ? 50 : parseInt(limit);
  
  const [problems, total] = await Promise.all([
    Problem.find(filter)
      .select('title slug difficulty tags metadata.acceptanceRate metadata.submissions metadata.views')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Problem.countDocuments(filter)
  ]);
  
  res.status(200).json(
    ApiResponse.success({
      problems,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: parseInt(page) < Math.ceil(total / limitNum),
        hasPrev: parseInt(page) > 1
      }
    }, 'Problems fetched successfully')
  );
});

// @desc    Get single problem by ID
// @route   GET /api/v1/problems/:id
// @access  Public
export const getProblem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid problem ID format');
  }
  
  const problem = await Problem.findOne({
    _id: id,
    'metadata.isPublished': true
  }).select('-testCases.isHidden -createdBy -updatedBy');
  
  if (!problem) {
    throw ApiError.notFound('Problem not found or not published');
  }
  
  // Increment view count
  problem.metadata.views += 1;
  await problem.save();
  
  res.status(200).json(
    ApiResponse.success({ problem }, 'Problem fetched successfully')
  );
});

// @desc    Get problem by slug
// @route   GET /api/v1/problems/slug/:slug
// @access  Public
export const getProblemBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  const problem = await Problem.findOne({
    slug,
    'metadata.isPublished': true
  }).select('-testCases.isHidden -createdBy -updatedBy');
  
  if (!problem) {
    throw ApiError.notFound('Problem not found or not published');
  }
  
  // Increment view count
  problem.metadata.views += 1;
  await problem.save();
  
  res.status(200).json(
    ApiResponse.success({ problem }, 'Problem fetched successfully')
  );
});

// @desc    Create new problem (Admin only)
// @route   POST /api/v1/problems
// @access  Private/Admin
export const createProblem = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    difficulty,
    tags,
    inputFormat,
    outputFormat,
    sampleInput,
    sampleOutput,
    testCases,
    constraints,
    hints,
    solution
  } = req.body;
  
  // Validate required fields
  if (!title || !description || !difficulty) {
    throw ApiError.badRequest('Title, description, and difficulty are required');
  }
  
  if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
    throw ApiError.badRequest('At least one test case is required');
  }
  
  // Generate slug
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  // Check if slug exists
  const existingProblem = await Problem.findOne({ slug });
  if (existingProblem) {
    throw ApiError.conflict('A problem with similar title already exists');
  }
  
  const problem = await Problem.create({
    title,
    slug,
    description,
    difficulty,
    tags: tags || [],
    inputFormat: inputFormat || '',
    outputFormat: outputFormat || '',
    sampleInput: sampleInput || [],
    sampleOutput: sampleOutput || [],
    testCases: testCases.map(tc => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isHidden: tc.isHidden || false,
      explanation: tc.explanation || ''
    })),
    constraints: {
      timeLimit: constraints?.timeLimit || 2000,
      memoryLimit: constraints?.memoryLimit || 256,
      inputConstraints: constraints?.inputConstraints || ''
    },
    hints: hints || [],
    solution: solution || {},
    createdBy: req.user._id,
    metadata: {
      isPublished: false,
      publishedAt: null
    }
  });
  
  res.status(201).json(
    ApiResponse.created({ problem }, 'Problem created successfully')
  );
});

// @desc    Update problem
// @route   PUT /api/v1/problems/:id
// @access  Private/Admin
export const updateProblem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid problem ID format');
  }
  
  const problem = await Problem.findById(id);
  if (!problem) {
    throw ApiError.notFound('Problem not found');
  }
  
  // If title is being updated, regenerate slug
  let updateData = { ...req.body };
  if (updateData.title && updateData.title !== problem.title) {
    const newSlug = updateData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const slugExists = await Problem.findOne({ 
      slug: newSlug, 
      _id: { $ne: id } 
    });
    
    if (slugExists) {
      throw ApiError.conflict('A problem with similar title already exists');
    }
    
    updateData.slug = newSlug;
  }
  
  updateData.updatedBy = req.user._id;
  
  const updatedProblem = await Problem.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );
  
  res.status(200).json(
    ApiResponse.success({ problem: updatedProblem }, 'Problem updated successfully')
  );
});

// @desc    Delete problem
// @route   DELETE /api/v1/problems/:id
// @access  Private/Admin
export const deleteProblem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid problem ID format');
  }
  
  const problem = await Problem.findByIdAndDelete(id);
  
  if (!problem) {
    throw ApiError.notFound('Problem not found');
  }
  
  res.status(200).json(
    ApiResponse.success(null, 'Problem deleted successfully')
  );
});

// @desc    Publish/unpublish problem
// @route   PATCH /api/v1/problems/:id/publish
// @access  Private/Admin
export const togglePublish = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { publish } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid problem ID format');
  }
  
  if (typeof publish !== 'boolean') {
    throw ApiError.badRequest('Publish flag must be true or false');
  }
  
  const updateData = {
    'metadata.isPublished': publish,
    updatedBy: req.user._id
  };
  
  if (publish) {
    updateData['metadata.publishedAt'] = new Date();
  } else {
    updateData['metadata.publishedAt'] = null;
  }
  
  const problem = await Problem.findByIdAndUpdate(
    id,
    updateData,
    { new: true }
  );
  
  if (!problem) {
    throw ApiError.notFound('Problem not found');
  }
  
  const message = publish ? 'Problem published successfully' : 'Problem unpublished successfully';
  
  res.status(200).json(
    ApiResponse.success({ problem }, message)
  );
});

// @desc    Get problem statistics
// @route   GET /api/v1/problems/:id/stats
// @access  Public
export const getProblemStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid problem ID format');
  }
  
  const problem = await Problem.findById(id)
    .select('title difficulty metadata.acceptanceRate metadata.submissions metadata.views metadata.likes metadata.dislikes');
  
  if (!problem) {
    throw ApiError.notFound('Problem not found');
  }
  
  res.status(200).json(
    ApiResponse.success(
      { stats: problem.metadata },
      'Problem statistics fetched successfully'
    )
  );
});

// @desc    Get problems by difficulty
// @route   GET /api/v1/problems/difficulty/:level
// @access  Public
export const getProblemsByDifficulty = asyncHandler(async (req, res) => {
  const { level } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  // Validate difficulty level
  const validLevels = ['easy', 'medium', 'hard'];
  if (!validLevels.includes(level)) {
    throw ApiError.badRequest('Invalid difficulty level. Use: easy, medium, hard');
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit) > 50 ? 50 : parseInt(limit);
  
  const [problems, total] = await Promise.all([
    Problem.find({
      difficulty: level,
      'metadata.isPublished': true
    })
    .select('title slug difficulty tags metadata.acceptanceRate')
    .sort('-metadata.acceptanceRate')
    .skip(skip)
    .limit(limitNum)
    .lean(),
    Problem.countDocuments({
      difficulty: level,
      'metadata.isPublished': true
    })
  ]);
  
  res.status(200).json(
    ApiResponse.success({
      difficulty: level,
      problems,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }, `Problems fetched for difficulty: ${level}`)
  );
});

// @desc    Search problems
// @route   GET /api/v1/problems/search
// @access  Public
export const searchProblems = asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;
  
  if (!q || q.trim().length < 2) {
    throw ApiError.badRequest('Search query must be at least 2 characters');
  }
  
  const problems = await Problem.find({
    'metadata.isPublished': true,
    $or: [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { tags: { $in: [new RegExp(q, 'i')] } }
    ]
  })
  .select('title slug difficulty tags')
  .limit(parseInt(limit))
  .lean();
  
  res.status(200).json(
    ApiResponse.success({ problems, query: q }, 'Search results fetched')
  );
});

// @desc    Get problem count by tags
// @route   GET /api/v1/problems/tags/stats
// @access  Public
export const getTagStats = asyncHandler(async (req, res) => {
  const tagStats = await Problem.aggregate([
    { $match: { 'metadata.isPublished': true } },
    { $unwind: '$tags' },
    { $group: {
      _id: '$tags',
      count: { $sum: 1 },
      avgAcceptance: { $avg: '$metadata.acceptanceRate' }
    }},
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]);
  
  res.status(200).json(
    ApiResponse.success({ tagStats }, 'Tag statistics fetched')
  );
});

// ============ ADDITIONAL FUNCTIONS (for those routes) ============

// @desc    Get problem discussion
// @route   GET /api/v1/problems/:id/discussion
// @access  Public
export const getProblemDiscussion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Placeholder - implement when you add discussion model
  res.status(200).json(
    ApiResponse.success(
      { 
        problemId: id,
        discussions: [],
        message: 'Discussion feature coming soon'
      },
      'Discussion placeholder'
    )
  );
});

// @desc    Like/Unlike problem
// @route   POST /api/v1/problems/:id/like
// @access  Private
export const likeProblem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { like = true } = req.body; // true for like, false for unlike
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid problem ID format');
  }
  
  const problem = await Problem.findById(id);
  if (!problem) {
    throw ApiError.notFound('Problem not found');
  }
  
  // Update like count (simplified - in real app, track individual likes)
  if (like) {
    problem.metadata.likes += 1;
  } else if (problem.metadata.likes > 0) {
    problem.metadata.likes -= 1;
  }
  
  await problem.save();
  
  res.status(200).json(
    ApiResponse.success(
      { 
        likes: problem.metadata.likes,
        liked: like
      },
      like ? 'Problem liked' : 'Problem unliked'
    )
  );
});

// @desc    Get similar problems
// @route   GET /api/v1/problems/:id/similar
// @access  Public
export const getSimilarProblems = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid problem ID format');
  }
  
  const problem = await Problem.findById(id);
  if (!problem) {
    throw ApiError.notFound('Problem not found');
  }
  
  // Find problems with similar tags
  const similarProblems = await Problem.find({
    _id: { $ne: id },
    'metadata.isPublished': true,
    tags: { $in: problem.tags },
    difficulty: problem.difficulty
  })
  .select('title slug difficulty tags metadata.acceptanceRate')
  .limit(5)
  .lean();
  
  res.status(200).json(
    ApiResponse.success(
      { similarProblems },
      'Similar problems fetched'
    )
  );
});

// @desc    Get problem editorial
// @route   GET /api/v1/problems/:id/editorial
// @access  Public
export const getProblemEditorial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid problem ID format');
  }
  
  const problem = await Problem.findById(id)
    .select('title editorial');
  
  if (!problem) {
    throw ApiError.notFound('Problem not found');
  }
  
  if (!problem.editorial || !problem.editorial.approach) {
    throw ApiError.notFound('Editorial not available for this problem');
  }
  
  res.status(200).json(
    ApiResponse.success(
      { editorial: problem.editorial },
      'Editorial fetched successfully'
    )
  );
});

// @desc    Run test cases (for problem creation)
// @route   POST /api/v1/problems/test-run
// @access  Private/Admin
export const runTestCases = asyncHandler(async (req, res) => {
  const { code, language, testCases } = req.body;
  
  if (!code || !language || !testCases || !Array.isArray(testCases)) {
    throw ApiError.badRequest('Code, language, and test cases are required');
  }
  
  // Simple mock execution
  const results = testCases.map((testCase, index) => {
    // Mock execution - replace with actual code execution
    const passed = Math.random() > 0.5; // 50% chance of passing
    
    return {
      testCaseIndex: index,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: passed ? testCase.expectedOutput : 'Wrong output',
      passed,
      runtime: Math.floor(Math.random() * 100) + 50,
      memory: Math.floor(Math.random() * 50) + 10
    };
  });
  
  const passedCount = results.filter(r => r.passed).length;
  
  res.status(200).json(
    ApiResponse.success({
      results,
      summary: {
        total: testCases.length,
        passed: passedCount,
        failed: testCases.length - passedCount,
        verdict: passedCount === testCases.length ? 'Accepted' : 'Wrong Answer'
      }
    }, 'Test cases executed')
  );
});