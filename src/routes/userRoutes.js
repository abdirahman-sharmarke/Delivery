const express = require('express');
const router = express.Router();

// Import controllers
const userController = require('../controllers/userController');

// Import middlewares
const { 
  authenticateToken, 
  requireAdmin, 
  requireOwnershipOrAdmin 
} = require('../middlewares/auth');

const { uploadProfilePicture } = require('../middlewares/upload');

const {
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validatePasswordChange,
  validateLocationUpdate,
  validateUUID
} = require('../middlewares/validation');

// Public routes (no authentication required)
router.post('/register', validateUserRegistration, userController.registerUser);
router.post('/login', validateUserLogin, userController.loginUser);

// User profile routes (authentication required)
router.get('/profile', authenticateToken, userController.getCurrentUser);
router.put('/profile', authenticateToken, validateUserUpdate, userController.updateUserProfile);
router.post('/profile/picture', authenticateToken, uploadProfilePicture, userController.uploadProfilePicture);
router.put('/profile/location', authenticateToken, validateLocationUpdate, userController.updateUserLocation);
router.put('/profile/password', authenticateToken, validatePasswordChange, userController.changePassword);

// User management routes (admin only)
router.get('/users', authenticateToken, requireAdmin, userController.getAllUsers);
router.get('/users/:id', authenticateToken, validateUUID, requireOwnershipOrAdmin, userController.getUserById);
router.put('/users/:id', authenticateToken, validateUUID, validateUserUpdate, requireOwnershipOrAdmin, userController.updateUserProfile);
router.delete('/users/:id', authenticateToken, validateUUID, requireAdmin, userController.deleteUser);

// Role-based routes (admin only)
router.get('/users/role/:role', authenticateToken, requireAdmin, userController.getUsersByRole);

module.exports = router; 