import React, { useState, useRef } from 'react';
import { FiUpload, FiX, FiImage } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const ImageUpload = ({ currentImage, onImageChange, maxSize = 5 }) => {
  const [preview, setPreview] = useState(currentImage);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB default)
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Image size should be less than ${maxSize}MB`);
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    await uploadImage(file);
  };

  const uploadImage = async (file) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const avatarUrl = response.data?.data?.avatarUrl || response.data?.data?.avatar;
      
      if (avatarUrl) {
        setPreview(avatarUrl);
        onImageChange(avatarUrl);
        toast.success('Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
      setPreview(currentImage); // Revert to original
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setUploading(true);
      await api.delete('/users/avatar');
      
      setPreview(null);
      onImageChange(null);
      toast.success('Profile picture removed');
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Preview */}
      <div className="relative group">
        {preview ? (
          <img
            src={preview}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-700"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center border-4 border-gray-700">
            <FiImage className="w-12 h-12 text-white" />
          </div>
        )}
        
        {/* Remove button */}
        {preview && !uploading && (
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-2 bg-red-500 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove image"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Upload button */}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <FiUpload className="w-4 h-4" />
          <span>{preview ? 'Change' : 'Upload'} Photo</span>
        </button>
      </div>

      {/* Info text */}
      <p className="text-xs text-gray-400 text-center">
        PNG, JPG or GIF (max {maxSize}MB)
      </p>
    </div>
  );
};

export default ImageUpload;