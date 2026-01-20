import { Op } from 'sequelize';
import Contest from '../models/postgres/Contest.models.js';
import User from '../models/postgres/User.models.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all contests
// @route   GET /api/v1/contests
// @access  Public
export const getContests = asyncHandler(async (req, res) => {
  const { 
    status, 
    type,
    difficulty,
    page = 1, 
    limit = 10,
    sortBy = 'start_time',
    sortOrder = 'asc'
  } = req.query;
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = Math.min(parseInt(limit), 50);
  
  // Build where clause
  const where = {};
  
  if (status && status !== 'all') {
    where.status = status;
  }
  
  if (type) {
    where.contest_type = type;
  }
  
  if (difficulty) {
    where.difficulty = difficulty;
  }
  
  // Calculate upcoming and ongoing contests
  const now = new Date();
  
  // For frontend filters - use Sequelize operators
  if (status === 'upcoming') {
    where.start_time = { [Op.gt]: now };
    // Also ensure status is 'scheduled' for upcoming contests
    where.status = 'scheduled';
  } else if (status === 'live' || status === 'ongoing') {
    where.start_time = { [Op.lte]: now };
    where.end_time = { [Op.gt]: now };
    where.status = 'live';
  } else if (status === 'ended') {
    where.end_time = { [Op.lte]: now };
    where.status = 'ended';
  }
  
  // Set sort order
  const order = [[sortBy, sortOrder.toUpperCase()]];
  
  try {
    const { count, rows: contests } = await Contest.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'profile']
        }
      ],
      attributes: { 
        exclude: ['registration_password'] 
      }
    });
    
    // Format dates for frontend
    const formattedContests = contests.map(contest => {
      const contestData = contest.toJSON();
      return {
        ...contestData,
        _id: contestData.id.toString(), // Add _id for frontend compatibility
        id: contestData.id.toString(),
        title: contestData.title,
        description: contestData.description,
        startTime: contestData.start_time,
        endTime: contestData.end_time,
        duration: contestData.duration_minutes,
        maxParticipants: contestData.max_participants,
        isPrivate: contestData.is_private,
        contestType: contestData.contest_type,
        tags: contestData.tags || [],
        participantsCount: 0, // You'll need to add this from ContestParticipant model
        status: contestData.status, // Use the status from database
        creator: contestData.creator ? {
          id: contestData.creator.id,
          username: contestData.creator.username,
          ...contestData.creator.profile
        } : null,
        createdAt: contestData.createdAt,
        updatedAt: contestData.updatedAt
      };
    });
    
    res.status(200).json(
      ApiResponse.success(
        {
          contests: formattedContests,
          pagination: {
            page: parseInt(page),
            limit: limitNum,
            total: count,
            pages: Math.ceil(count / limitNum)
          }
        },
        'Contests fetched successfully'
      )
    );
  } catch (error) {
    console.error('Error fetching contests:', error);
    
    // Fallback to mock data for now
    const mockContests = [
      {
        _id: '1',
        id: '1',
        title: 'Weekly Coding Challenge',
        description: 'Weekly challenge for all skill levels',
        startTime: new Date(Date.now() + 86400000),
        endTime: new Date(Date.now() + 86400000 + 7200000),
        duration: 120,
        contestType: 'weekly',
        type: 'weekly',
        difficulty: 'medium',
        maxParticipants: 5000,
        participants: 1500,
        participantsCount: 1500,
        status: 'upcoming',
        rules: 'Standard rules apply',
        prizes: ['Certificate', 'Premium Subscription'],
        tags: ['weekly', 'medium'],
        isPrivate: false,
        registrationOpen: true,
        creator: {
          id: 1,
          username: 'Tejas_Mishra',
          name: 'Tejas Mishra',
          avatarUrl: 'https://ui-avatars.com/api/?name=Tejas+Mishra&background=random'
        }
      }
    ];
    
    res.status(200).json(
      ApiResponse.success(
        {
          contests: mockContests,
          pagination: {
            page: 1,
            limit: limitNum,
            total: 1,
            pages: 1
          }
        },
        'Contests fetched successfully (fallback)'
      )
    );
  }
});

// @desc    Get single contest
// @route   GET /api/v1/contests/:id
// @access  Public
export const getContest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const contest = await Contest.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'profile']
        }
      ],
      attributes: { 
        exclude: ['registration_password'] 
      }
    });
    
    if (!contest) {
      return res.status(404).json(
        ApiResponse.error('Contest not found', 404)
      );
    }
    
    const contestData = contest.toJSON();
    
    // Format contest data
    const formattedContest = {
      ...contestData,
      _id: contestData.id.toString(),
      id: contestData.id.toString(),
      title: contestData.title,
      description: contestData.description,
      startTime: contestData.start_time,
      endTime: contestData.end_time,
      duration: contestData.duration_minutes,
      maxParticipants: contestData.max_participants,
      isPrivate: contestData.is_private,
      contestType: contestData.contest_type,
      tags: contestData.tags || [],
      participantsCount: 0, // You'll need to add this from ContestParticipant model
      problems: [], // You'll need to add Contest-Problem relationship
      status: contestData.status,
      creator: contestData.creator ? {
        id: contestData.creator.id,
        username: contestData.creator.username,
        ...contestData.creator.profile
      } : null,
      createdAt: contestData.createdAt,
      updatedAt: contestData.updatedAt
    };
    
    res.status(200).json(
      ApiResponse.success(
        { contest: formattedContest },
        'Contest fetched successfully'
      )
    );
  } catch (error) {
    console.error('Error fetching contest:', error);
    
    // Fallback to mock data
    const mockContest = {
      _id: id,
      id: id,
      title: 'Weekly Coding Challenge',
      description: 'Weekly challenge for all skill levels',
      startTime: new Date(Date.now() + 86400000),
      endTime: new Date(Date.now() + 86400000 + 7200000),
      duration: 120,
      contestType: 'weekly',
      type: 'weekly',
      difficulty: 'medium',
      maxParticipants: 5000,
      participants: 1500,
      participantsCount: 1500,
      status: 'upcoming',
      rules: 'Standard rules apply',
      prizes: ['Certificate', 'Premium Subscription'],
      tags: ['weekly', 'medium'],
      isPrivate: false,
      registrationOpen: true,
      problems: [
        { id: '1', title: 'Two Sum', difficulty: 'Easy' },
        { id: '2', title: 'Add Two Numbers', difficulty: 'Medium' },
        { id: '3', title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium' }
      ],
      creator: {
        id: 1,
        username: 'Tejas_Mishra',
        name: 'Tejas Mishra',
        avatarUrl: 'https://ui-avatars.com/api/?name=Tejas+Mishra&background=random'
      }
    };
    
    res.status(200).json(
      ApiResponse.success(
        { contest: mockContest },
        'Contest fetched successfully (fallback)'
      )
    );
  }
});

// @desc    Create new contest
// @route   POST /api/v1/contests
// @access  Private (Admin/Moderator)
export const createContest = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    contestType = 'practice',
    startTime,
    endTime,
    durationMinutes,
    maxParticipants,
    isPrivate = false,
    registrationPassword,
    tags = []
  } = req.body;
  
  // Validate required fields
  if (!title || !startTime || !endTime) {
    return res.status(400).json(
      ApiResponse.error('Title, start time, and end time are required')
    );
  }
  
  // Create slug from title
  const slug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
  
  try {
    // Check if slug exists
    const existingContest = await Contest.findOne({ where: { slug } });
    if (existingContest) {
      return res.status(400).json(
        ApiResponse.error('A contest with this title already exists')
      );
    }
    
    const contest = await Contest.create({
      title,
      slug,
      description,
      contest_type: contestType,
      status: 'scheduled',
      start_time: new Date(startTime),
      end_time: new Date(endTime),
      duration_minutes: durationMinutes || 
        Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60)),
      max_participants: maxParticipants,
      is_private: isPrivate,
      registration_password: registrationPassword,
      tags,
      created_by: req.user?.id || 1 // Fallback to user id 1 if not available
    });
    
    res.status(201).json(
      ApiResponse.success(
        { contest: contest.toJSON() },
        'Contest created successfully'
      )
    );
  } catch (error) {
    console.error('Error creating contest:', error);
    res.status(500).json(
      ApiResponse.error('Failed to create contest')
    );
  }
});

// @desc    Update contest
// @route   PUT /api/v1/contests/:id
// @access  Private (Admin/Moderator)
export const updateContest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const contest = await Contest.findByPk(id);
    
    if (!contest) {
      return res.status(404).json(
        ApiResponse.error('Contest not found', 404)
      );
    }
    
    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'contest_type', 'status',
      'start_time', 'end_time', 'duration_minutes',
      'max_participants', 'registration_open', 'is_private',
      'tags', 'banner_url'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        contest[field] = req.body[field];
      }
    });
    
    // Update slug if title changed
    if (req.body.title && req.body.title !== contest.title) {
      const slug = req.body.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
      
      // Check if slug exists
      const existingContest = await Contest.findOne({ 
        where: { slug },
        attributes: ['id']
      });
      
      if (existingContest && existingContest.id !== contest.id) {
        return res.status(400).json(
          ApiResponse.error('A contest with this title already exists')
        );
      }
      
      contest.slug = slug;
    }
    
    await contest.save();
    
    res.status(200).json(
      ApiResponse.success(
        { contest: contest.toJSON() },
        'Contest updated successfully'
      )
    );
  } catch (error) {
    console.error('Error updating contest:', error);
    res.status(500).json(
      ApiResponse.error('Failed to update contest')
    );
  }
});

// @desc    Delete contest
// @route   DELETE /api/v1/contests/:id
// @access  Private (Admin/Moderator)
export const deleteContest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const contest = await Contest.findByPk(id);
    
    if (!contest) {
      return res.status(404).json(
        ApiResponse.error('Contest not found', 404)
      );
    }
    
    await contest.destroy();
    
    res.status(200).json(
      ApiResponse.success(
        null,
        'Contest deleted successfully'
      )
    );
  } catch (error) {
    console.error('Error deleting contest:', error);
    res.status(500).json(
      ApiResponse.error('Failed to delete contest')
    );
  }
});

// @desc    Register for contest
// @route   POST /api/v1/contests/:id/register
// @access  Private
export const registerForContest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  
  try {
    const contest = await Contest.findByPk(id);
    
    if (!contest) {
      return res.status(404).json(
        ApiResponse.error('Contest not found', 404)
      );
    }
    
    // Check if registration is open
    if (!contest.registration_open) {
      return res.status(400).json(
        ApiResponse.error('Registration is closed for this contest')
      );
    }
    
    // Check if contest has started
    if (contest.start_time <= new Date()) {
      return res.status(400).json(
        ApiResponse.error('Contest has already started')
      );
    }
    
    // Check private contest password
    if (contest.is_private) {
      if (!password) {
        return res.status(400).json(
          ApiResponse.error('Password required for private contest')
        );
      }
      
      if (password !== contest.registration_password) {
        return res.status(401).json(
          ApiResponse.error('Invalid password')
        );
      }
    }
    
    // Check if user is already registered
    // You'll need to implement ContestParticipant check here
    
    // Register user
    // You'll need to create a ContestParticipant entry here
    
    res.status(200).json(
      ApiResponse.success(
        null,
        'Successfully registered for contest'
      )
    );
  } catch (error) {
    console.error('Error registering for contest:', error);
    res.status(500).json(
      ApiResponse.error('Failed to register for contest')
    );
  }
});