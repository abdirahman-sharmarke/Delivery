const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT token and authenticate user
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

/**
 * Check if user has required role
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Check if user is admin
 */
const requireAdmin = requireRole('admin');

/**
 * Check if user is driver
 */
const requireDriver = requireRole('driver');

/**
 * Check if user is customer
 */
const requireCustomer = requireRole('customer');

/**
 * Check if user is admin or driver
 */
const requireAdminOrDriver = requireRole('admin', 'driver');

/**
 * Check if user is accessing their own resource or is admin
 */
const requireOwnershipOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const resourceUserId = req.params.userId || req.params.id;
  
  if (req.user.role === 'admin' || req.user.id === resourceUserId) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied - insufficient permissions'
    });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireDriver,
  requireCustomer,
  requireAdminOrDriver,
  requireOwnershipOrAdmin
}; 