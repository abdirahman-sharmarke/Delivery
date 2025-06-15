const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Validate order creation
 */
const validateOrderCreation = [
  body('pickup_address')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Pickup address must be between 5 and 500 characters'),
  
  body('pickup_lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Pickup latitude must be between -90 and 90'),
  
  body('pickup_lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Pickup longitude must be between -180 and 180'),
  
  body('dropoff_address')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Dropoff address must be between 5 and 500 characters'),
  
  body('dropoff_lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Dropoff latitude must be between -90 and 90'),
  
  body('dropoff_lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Dropoff longitude must be between -180 and 180'),
  
  body('package_description')
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Package description must be between 5 and 1000 characters'),
  
  body('price')
    .isFloat({ min: 0.01, max: 99999.99 })
    .withMessage('Price must be between $0.01 and $99,999.99'),
  
  handleValidationErrors
];

/**
 * Validate order update
 */
const validateOrderUpdate = [
  body('pickup_address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Pickup address must be between 5 and 500 characters'),
  
  body('pickup_lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Pickup latitude must be between -90 and 90'),
  
  body('pickup_lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Pickup longitude must be between -180 and 180'),
  
  body('dropoff_address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Dropoff address must be between 5 and 500 characters'),
  
  body('dropoff_lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Dropoff latitude must be between -90 and 90'),
  
  body('dropoff_lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Dropoff longitude must be between -180 and 180'),
  
  body('package_description')
    .optional()
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Package description must be between 5 and 1000 characters'),
  
  body('price')
    .optional()
    .isFloat({ min: 0.01, max: 99999.99 })
    .withMessage('Price must be between $0.01 and $99,999.99'),
  
  handleValidationErrors
];

/**
 * Validate driver assignment
 */
const validateDriverAssignment = [
  body('driver_id')
    .isUUID()
    .withMessage('Driver ID must be a valid UUID'),
  
  handleValidationErrors
];

/**
 * Validate status update
 */
const validateStatusUpdate = [
  body('delivery_status')
    .optional()
    .isIn(['pending', 'assigned', 'picked', 'in_transit', 'delivered', 'cancelled'])
    .withMessage('Delivery status must be: pending, assigned, picked, in_transit, delivered, or cancelled'),
  
  body('payment_status')
    .optional()
    .isIn(['pending', 'paid', 'failed'])
    .withMessage('Payment status must be: pending, paid, or failed'),
  
  handleValidationErrors
];

/**
 * Validate UUID parameter
 */
const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('ID must be a valid UUID'),
  
  handleValidationErrors
];

/**
 * Validate query parameters for listing orders
 */
const validateOrderQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('delivery_status')
    .optional()
    .isIn(['pending', 'assigned', 'picked', 'in_transit', 'delivered', 'cancelled'])
    .withMessage('Delivery status must be: pending, assigned, picked, in_transit, delivered, or cancelled'),
  
  query('payment_status')
    .optional()
    .isIn(['pending', 'paid', 'failed'])
    .withMessage('Payment status must be: pending, paid, or failed'),
  
  query('customer_id')
    .optional()
    .isUUID()
    .withMessage('Customer ID must be a valid UUID'),
  
  query('driver_id')
    .optional()
    .isUUID()
    .withMessage('Driver ID must be a valid UUID'),
  
  handleValidationErrors
];

module.exports = {
  validateOrderCreation,
  validateOrderUpdate,
  validateDriverAssignment,
  validateStatusUpdate,
  validateUUID,
  validateOrderQuery
}; 