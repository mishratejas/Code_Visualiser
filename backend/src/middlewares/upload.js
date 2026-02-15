import multer from 'multer';
import path from 'path';
import fs from 'fs';

/**
 * Multer configuration for file uploads
 * Supports both memory storage (for Cloudinary) and disk storage
 */

// Ensure uploads directory exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Memory storage configuration (recommended for Cloudinary)
const memoryStorage = multer.memoryStorage();

// Disk storage configuration (for temporary files)
const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, name + '-' + uniqueSuffix + ext);
  }
});

// File filter for images only
const imageFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

// File filter for all files
const anyFilter = (req, file, cb) => {
  cb(null, true);
};

// Upload configurations
const uploadConfigs = {
  // Memory storage (for Cloudinary uploads)
  memory: {
    storage: memoryStorage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: imageFilter
  },
  
  // Disk storage (for temporary files)
  disk: {
    storage: diskStorage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: imageFilter
  },
  
  // Avatar upload (memory storage, smaller size)
  avatar: {
    storage: memoryStorage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: imageFilter
  },
  
  // Document upload
  document: {
    storage: diskStorage,
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
    fileFilter: anyFilter
  }
};

// Create multer instances
export const upload = multer(uploadConfigs.memory);
export const uploadDisk = multer(uploadConfigs.disk);
export const uploadAvatar = multer(uploadConfigs.avatar);
export const uploadDocument = multer(uploadConfigs.document);

// Middleware to handle multer errors
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed'
    });
  }
  
  next();
};

// Default export
export default upload;