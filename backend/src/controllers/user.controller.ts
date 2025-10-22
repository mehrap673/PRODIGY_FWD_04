import { Response } from 'express';
import User from '../models/User';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { uploadImage, deleteFile } from '../services/cloudinary.service';
import fs from 'fs';

// Get current user profile
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    sendSuccess(res, 200, 'User fetched successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
    });
  } catch (error: any) {
    sendError(res, 500, error.message || 'Server error');
  }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, avatar } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!name && !avatar) {
      return sendError(res, 400, 'Please provide name or avatar to update');
    }

    // Build update object
    const updateData: any = {};
    if (name) {
      if (name.trim().length < 2) {
        return sendError(res, 400, 'Name must be at least 2 characters long');
      }
      updateData.name = name.trim();
    }
    if (avatar) updateData.avatar = avatar;

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    sendSuccess(res, 200, 'Profile updated successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
    });
  } catch (error: any) {
    sendError(res, 500, error.message || 'Server error');
  }
};

// Update avatar with file upload
// controllers/user.controller.ts
export const updateAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const file = req.file;

    console.log('📸 Avatar update request received');
    console.log('👤 User ID:', userId);
    console.log('📁 File:', file ? {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    } : 'undefined');

    // Check if file is provided
    if (!file) {
      console.error('❌ No file received in request');
      return sendError(res, 400, 'Please upload an image file');
    }

    // Validate file type (extra check)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      console.error('❌ Invalid file type:', file.mimetype);
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return sendError(res, 400, 'Only JPEG, PNG, and WebP images are allowed');
    }

    // Validate file size (5MB max for avatars)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size);
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return sendError(res, 400, 'File size must be less than 5MB');
    }

    console.log('✅ File validation passed');

    // Get current user to delete old avatar
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return sendError(res, 404, 'User not found');
    }

    // Delete old avatar from Cloudinary if it exists
    if (currentUser.avatar) {
      try {
        const urlParts = currentUser.avatar.split('/');
        const publicIdWithExt = urlParts[urlParts.length - 1];
        const folderPath = urlParts[urlParts.length - 2];
        const publicId = `${folderPath}/${publicIdWithExt.split('.')[0]}`;

        await deleteFile(publicId);
        console.log('🗑️ Old avatar deleted from Cloudinary');
      } catch (error) {
        console.error('⚠️ Failed to delete old avatar:', error);
        // Continue with upload even if deletion fails
      }
    }

    // Upload new avatar to Cloudinary
    console.log('📤 Uploading to Cloudinary...');
    const avatarUrl = await uploadImage(file.path);
    console.log('✅ Avatar uploaded successfully:', avatarUrl);

    // Update user with new avatar URL
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    console.log('✅ User updated with new avatar');

    sendSuccess(res, 200, 'Avatar updated successfully', {
      avatar: avatarUrl,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    console.error('❌ Avatar update error:', error);

    // Clean up uploaded file if it still exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    sendError(res, 500, error.message || 'Failed to update avatar');
  }
};


// Get user by ID (for viewing other users)
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    sendSuccess(res, 200, 'User fetched successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
    });
  } catch (error: any) {
    sendError(res, 500, error.message || 'Server error');
  }
};

// Delete user account
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    // Get user to delete avatar from Cloudinary
    const user = await User.findById(userId);

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // Delete avatar from Cloudinary if exists
    if (user.avatar) {
      try {
        const urlParts = user.avatar.split('/');
        const publicIdWithExt = urlParts[urlParts.length - 1];
        const folderPath = urlParts[urlParts.length - 2];
        const publicId = `${folderPath}/${publicIdWithExt.split('.')[0]}`;

        await deleteFile(publicId);
        console.log('🗑️ User avatar deleted from Cloudinary');
      } catch (error) {
        console.error('Failed to delete avatar:', error);
        // Continue with account deletion even if avatar deletion fails
      }
    }

    // Delete user account
    await User.findByIdAndDelete(userId);

    sendSuccess(res, 200, 'Account deleted successfully', null);
  } catch (error: any) {
    sendError(res, 500, error.message || 'Server error');
  }
};

// Change password
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return sendError(res, 400, 'Current password and new password are required');
    }

    if (newPassword.length < 6) {
      return sendError(res, 400, 'New password must be at least 6 characters long');
    }

    // Find user with password
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return sendError(res, 401, 'Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    sendSuccess(res, 200, 'Password changed successfully', null);
  } catch (error: any) {
    sendError(res, 500, error.message || 'Server error');
  }
};
