const express = require('express');
const router = express.Router();

// Import controllers
const orderController = require('../controllers/orderController');

// Import middlewares
const { 
  authenticateToken, 
  requireAdmin, 
  requireAdminOrDriver 
} = require('../middlewares/auth');

const {
  validateOrderCreation,
  validateOrderUpdate,
  validateDriverAssignment,
  validateStatusUpdate,
  validateUUID,
  validateOrderQuery
} = require('../middlewares/orderValidation');

// **PUBLIC ROUTES** (none for orders - all require authentication)

// **SPECIAL ROUTES** (must come before generic routes to avoid conflicts)
router.get('/orders/available', authenticateToken, orderController.getAvailableOrders);

// **AUTHENTICATED ROUTES** (all roles)
router.get('/orders', authenticateToken, validateOrderQuery, orderController.getAllOrders);
router.get('/orders/:id', authenticateToken, validateUUID, orderController.getOrderById);

// **CUSTOMER ROUTES** (customers and admins)
router.post('/orders', authenticateToken, validateOrderCreation, orderController.createOrder);
router.put('/orders/:id', authenticateToken, validateUUID, validateOrderUpdate, orderController.updateOrder);
router.delete('/orders/:id', authenticateToken, validateUUID, orderController.cancelOrder);

// **ADMIN AND DRIVER ROUTES** (status updates)
router.put('/orders/:id/status', authenticateToken, requireAdminOrDriver, validateUUID, validateStatusUpdate, orderController.updateOrderStatus);

// **ADMIN ONLY ROUTES**
router.put('/orders/:id/assign', authenticateToken, requireAdmin, validateUUID, validateDriverAssignment, orderController.assignDriver);

module.exports = router; 