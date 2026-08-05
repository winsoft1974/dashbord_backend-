import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import AdminUser from '../models/AdminUser';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { success, error } from '../utils/apiResponse';

const router = Router();

// Generate JWT Helper
const generateToken = (id: string, username: string, email: string, role: string) => {
  return jwt.sign(
    { id, username, email, role },
    process.env.JWT_SECRET || 'winsoft_super_secret_dev_key_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @route   POST /api/auth/login
// @desc    Admin login
// @access  Public
router.post('/login', async (req: any, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return error(res, 'Please provide username/email and password', 400);
    }

    // Try finding by username or email
    const user = await AdminUser.findOne({
      $or: [
        { username: username.toLowerCase().trim() },
        { email: username.toLowerCase().trim() }
      ]
    });

    if (!user || !user.active) {
      return error(res, 'Invalid credentials', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return error(res, 'Invalid credentials', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id.toString(), user.username, user.email, user.role);

    return success(res, {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin
      }
    }, 'Logged in successfully');
  } catch (err: any) {
    console.error('Login error:', err);
    return error(res, 'Server error during login', 500);
  }
});

// @route   GET /api/auth/me
// @desc    Get current admin profile
// @access  Protected
router.get('/me', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.admin) {
      return error(res, 'Unauthorized', 401);
    }

    const user = await AdminUser.findById(req.admin.id).select('-passwordHash');
    if (!user) {
      return error(res, 'User not found', 404);
    }

    return success(res, user);
  } catch (err: any) {
    console.error('Get profile error:', err);
    return error(res, 'Server error', 500);
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change admin password
// @access  Protected
router.put('/change-password', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return error(res, 'Please provide current and new passwords', 400);
    }

    if (!req.admin) {
      return error(res, 'Unauthorized', 401);
    }

    const user = await AdminUser.findById(req.admin.id);
    if (!user) {
      return error(res, 'User not found', 404);
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return error(res, 'Incorrect current password', 400);
    }

    // Encrypt and save new password
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    return success(res, null, 'Password updated successfully');
  } catch (err: any) {
    console.error('Change password error:', err);
    return error(res, 'Server error', 500);
  }
});

export default router;
