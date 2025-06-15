const { body, param, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

/**
 * User registration validation
 */
const validateUserRegistration = [
  body('full_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['admin', 'driver', 'customer'])
    .withMessage('Role must be admin, driver, or customer'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  
  // Driver-specific validations
  body('vehicle_number')
    .if((value, { req }) => req.body.role === 'driver')
    .notEmpty()
    .withMessage('Vehicle number is required for drivers')
    .isLength({ max: 20 })
    .withMessage('Vehicle number must not exceed 20 characters'),
  
  body('license_number')
    .if((value, { req }) => req.body.role === 'driver')
    .notEmpty()
    .withMessage('License number is required for drivers')
    .isLength({ max: 50 })
    .withMessage('License number must not exceed 50 characters'),
  
  handleValidationErrors
];

/**
 * User login validation
 */
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * User profile update validation
 */
const validateUserUpdate = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  
  body('vehicle_number')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Vehicle number must not exceed 20 characters'),
  
  body('license_number')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('License number must not exceed 50 characters'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended', 'pending'])
    .withMessage('Status must be active, inactive, suspended, or pending'),
  
  handleValidationErrors
];

/**
 * Password change validation
 */
const validatePasswordChange = [
  body('current_password')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('new_password')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('confirm_password')
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Location update validation
 */
const validateLocationUpdate = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  handleValidationErrors
];

/**
 * UUID parameter validation
 */
const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID format'),
  
  handleValidationErrors
];

/**
 * Query parameter validation for user listing
 */
const validateUserQuery = [
  body('role')
    .optional()
    .isIn(['admin', 'driver', 'customer'])
    .withMessage('Role must be admin, driver, or customer'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended', 'pending'])
    .withMessage('Status must be active, inactive, suspended, or pending'),
  
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validatePasswordChange,
  validateLocationUpdate,
  validateUUID,
  validateUserQuery
}; 