const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const imageService = require('../services/imageService');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Register new user
 */
const registerUser = async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      password,
      role = 'customer',
      address,
      vehicle_number,
      license_number
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { phone }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    // Create user
    const userData = {
      full_name,
      email,
      phone,
      password,
      role,
      address
    };

    // Add driver-specific fields if role is driver
    if (role === 'driver') {
      userData.vehicle_number = vehicle_number;
      userData.license_number = license_number;
    }

    const user = await User.create(userData);
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

/**
 * Login user
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active. Please contact support.'
      });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

/**
 * Get current user profile
 */
const getCurrentUser = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
};

/**
 * Update user profile
 */
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated through this endpoint
    delete updateData.password;
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.updated_at;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check for email/phone uniqueness if being updated
    if (updateData.email || updateData.phone) {
      const existingUser = await User.findOne({
        where: {
          [Op.and]: [
            { id: { [Op.ne]: userId } },
            {
              [Op.or]: [
                updateData.email ? { email: updateData.email } : null,
                updateData.phone ? { phone: updateData.phone } : null
              ].filter(Boolean)
            }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email or phone already in use'
        });
      }
    }

    await user.update(updateData);
    await user.reload();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * Upload profile picture
 */
const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Upload image to Supabase
    const uploadResult = await imageService.uploadImage(req.file, userId);

    if (!uploadResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Image upload failed',
        error: uploadResult.error
      });
    }

    // Update user profile picture URL
    const user = await User.findByPk(userId);
    
    // Delete old profile picture if exists
    if (user.profile_picture) {
      const oldFileName = user.profile_picture.split('/').pop();
      await imageService.deleteImage(`${userId}/${oldFileName}`);
    }

    await user.update({
      profile_picture: uploadResult.publicUrl
    });

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profile_picture: uploadResult.publicUrl,
        upload_info: uploadResult
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture',
      error: error.message
    });
  }
};

/**
 * Update user location
 */
const updateUserLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        updated_at: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        location: user.location
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(current_password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    await user.update({ password: new_password });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

/**
 * Get all users (Admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      status,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Filter by role
    if (role) {
      whereClause.role = role;
    }

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Search by name, email, or phone
    if (search) {
      whereClause[Op.or] = [
        { full_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { rows: users, count: total } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_users: total,
          per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message
    });
  }
};

/**
 * Delete user (Admin only)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting the current admin user
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Delete profile picture from Supabase if exists
    if (user.profile_picture) {
      const fileName = user.profile_picture.split('/').pop();
      await imageService.deleteImage(`${user.id}/${fileName}`);
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

/**
 * Get users by role
 */
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    const users = await User.findByRole(role);

    res.json({
      success: true,
      data: {
        users,
        count: users.length
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get users by role',
      error: error.message
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  updateUserProfile,
  uploadProfilePicture,
  updateUserLocation,
  changePassword,
  getAllUsers,
  getUserById,
  deleteUser,
  getUsersByRole
}; 