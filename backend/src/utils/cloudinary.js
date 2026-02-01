import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

/**
 * Cloudinary Configuration and Utility Functions
 * Handles image uploads, transformations, and management
 */

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Upload image to Cloudinary
 * @param {string} localFilePath - Path to local file
 * @param {Object} options - Upload options
 * @param {string} options.folder - Cloudinary folder name
 * @param {string} options.resourceType - Resource type ('image', 'video', 'raw', 'auto')
 * @param {Object} options.transformation - Transformation options
 * @returns {Promise<Object>} - Uploaded file details
 */
export const uploadOnCloudinary = async (localFilePath, options = {}) => {
  try {
    if (!localFilePath) {
      throw new Error('File path is required');
    }

    // Check if file exists
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`File not found: ${localFilePath}`);
    }

    // Default options
    const uploadOptions = {
      resource_type: options.resourceType || 'auto',
      folder: options.folder || 'code-visualizer',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      ...options
    };

    // Upload file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, uploadOptions);

    // Delete local file after successful upload
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return {
      success: true,
      url: response.secure_url,
      publicId: response.public_id,
      format: response.format,
      width: response.width,
      height: response.height,
      bytes: response.bytes,
      resourceType: response.resource_type,
      createdAt: response.created_at
    };
  } catch (error) {
    // Clean up local file on error
    if (localFilePath && fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (unlinkError) {
        console.error('Error deleting local file:', unlinkError);
      }
    }

    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
  }
};

/**
 * Upload image from buffer
 * @param {Buffer} buffer - Image buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Uploaded file details
 */
export const uploadBufferOnCloudinary = async (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: options.resourceType || 'auto',
      folder: options.folder || 'code-visualizer',
      ...options
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(new Error(`Failed to upload buffer to Cloudinary: ${error.message}`));
        } else {
          resolve({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            resourceType: result.resource_type,
            createdAt: result.created_at
          });
        }
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - Resource type ('image', 'video', 'raw')
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    if (!publicId) {
      throw new Error('Public ID is required');
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });

    return {
      success: result.result === 'ok',
      result: result.result
    };
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    throw new Error(`Failed to delete file from Cloudinary: ${error.message}`);
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {string[]} publicIds - Array of Cloudinary public IDs
 * @param {string} resourceType - Resource type
 * @returns {Promise<Object>} - Deletion results
 */
export const deleteBulkFromCloudinary = async (publicIds, resourceType = 'image') => {
  try {
    if (!publicIds || publicIds.length === 0) {
      throw new Error('Public IDs array is required');
    }

    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type: resourceType
    });

    return {
      success: true,
      deleted: result.deleted,
      deletedCount: Object.keys(result.deleted).length
    };
  } catch (error) {
    console.error('Cloudinary bulk deletion error:', error);
    throw new Error(`Failed to delete files from Cloudinary: ${error.message}`);
  }
};

/**
 * Get image transformation URL
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} transformations - Transformation options
 * @returns {string} - Transformed image URL
 */
export const getTransformedImageUrl = (publicId, transformations = {}) => {
  try {
    return cloudinary.url(publicId, {
      secure: true,
      ...transformations
    });
  } catch (error) {
    console.error('Cloudinary transformation error:', error);
    throw new Error(`Failed to generate transformed URL: ${error.message}`);
  }
};

/**
 * Generate avatar upload options with optimizations
 * @returns {Object} - Upload options optimized for avatars
 */
export const getAvatarUploadOptions = () => {
  return {
    folder: 'code-visualizer/avatars',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    allowed_formats: ['jpg', 'png', 'webp']
  };
};

/**
 * Generate problem image upload options
 * @returns {Object} - Upload options optimized for problem images
 */
export const getProblemImageUploadOptions = () => {
  return {
    folder: 'code-visualizer/problems',
    transformation: [
      { width: 1200, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    allowed_formats: ['jpg', 'png', 'webp', 'svg']
  };
};

/**
 * Generate contest banner upload options
 * @returns {Object} - Upload options optimized for contest banners
 */
export const getContestBannerUploadOptions = () => {
  return {
    folder: 'code-visualizer/contests',
    transformation: [
      { width: 1920, height: 600, crop: 'fill' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    allowed_formats: ['jpg', 'png', 'webp']
  };
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Extracted public ID or null
 */
export const extractPublicId = (url) => {
  try {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // Match Cloudinary URL pattern and extract public ID
    const regex = /\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/i;
    const match = url.match(regex);
    
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

/**
 * Check if Cloudinary is configured
 * @returns {boolean} - True if configured, false otherwise
 */
export const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

// Export Cloudinary instance for advanced usage
export { cloudinary };

// Default export with all functions
export default {
  uploadOnCloudinary,
  uploadBufferOnCloudinary,
  deleteFromCloudinary,
  deleteBulkFromCloudinary,
  getTransformedImageUrl,
  getAvatarUploadOptions,
  getProblemImageUploadOptions,
  getContestBannerUploadOptions,
  extractPublicId,
  isCloudinaryConfigured,
  cloudinary
};