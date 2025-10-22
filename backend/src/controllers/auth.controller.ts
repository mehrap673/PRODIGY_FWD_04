import { Request, Response } from 'express';
import User from '../models/User';
import { generateToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

// Register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 400, 'User already exists with this email');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    // Generate token
    const token = generateToken(user._id.toString());

    sendSuccess(res, 201, 'User registered successfully', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isOnline: user.isOnline,
      },
    });
  } catch (error: any) {
    sendError(res, 500, error.message || 'Server error');
  }
};

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendError(res, 401, 'Invalid email or password');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return sendError(res, 401, 'Invalid email or password');
    }

    // Update online status
    user.isOnline = true;
    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    sendSuccess(res, 200, 'Login successful', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isOnline: user.isOnline,
      },
    });
  } catch (error: any) {
    sendError(res, 500, error.message || 'Server error');
  }
};

// Get current user
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

// Logout
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user) {
      user.isOnline = false;
      user.lastSeen = new Date();
      await user.save();
    }

    sendSuccess(res, 200, 'Logout successful', null);
  } catch (error: any) {
    sendError(res, 500, error.message || 'Server error');
  }
};
