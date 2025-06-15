const { Op } = require('sequelize');
const Order = require('../models/Order');
const User = require('../models/User');

/**
 * Create new order
 */
const createOrder = async (req, res) => {
  try {
    const {
      pickup_address,
      pickup_lat,
      pickup_lng,
      dropoff_address,
      dropoff_lat,
      dropoff_lng,
      package_description,
      price
    } = req.body;

    // Ensure customer role
    if (req.user.role !== 'customer' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can create orders'
      });
    }

    const orderData = {
      customer_id: req.user.id,
      pickup_address,
      pickup_lat,
      pickup_lng,
      dropoff_address,
      dropoff_lat,
      dropoff_lng,
      package_description,
      price
    };

    const order = await Order.create(orderData);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

/**
 * Get all orders with filters and pagination
 */
const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      delivery_status,
      payment_status,
      customer_id,
      driver_id,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Role-based access control
    if (req.user.role === 'customer') {
      whereClause.customer_id = req.user.id;
    } else if (req.user.role === 'driver') {
      whereClause.driver_id = req.user.id;
    }
    // Admin can see all orders

    // Apply filters
    if (delivery_status) {
      whereClause.delivery_status = delivery_status;
    }

    if (payment_status) {
      whereClause.payment_status = payment_status;
    }

    if (customer_id && req.user.role === 'admin') {
      whereClause.customer_id = customer_id;
    }

    if (driver_id && req.user.role === 'admin') {
      whereClause.driver_id = driver_id;
    }

    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { pickup_address: { [Op.iLike]: `%${search}%` } },
        { dropoff_address: { [Op.iLike]: `%${search}%` } },
        { package_description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'full_name', 'email', 'phone'],
          foreignKey: 'customer_id'
        },
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'full_name', 'email', 'phone', 'vehicle_number'],
          foreignKey: 'driver_id',
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        orders: rows,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total_items: count,
          total_pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get orders',
      error: error.message
    });
  }
};

/**
 * Get order by ID
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'full_name', 'email', 'phone'],
          foreignKey: 'customer_id'
        },
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'full_name', 'email', 'phone', 'vehicle_number'],
          foreignKey: 'driver_id',
          required: false
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Authorization check
    if (req.user.role === 'customer' && order.customer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === 'driver' && order.driver_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { order }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get order',
      error: error.message
    });
  }
};

/**
 * Update order (limited fields based on role)
 */
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Authorization and field restrictions
    if (req.user.role === 'customer') {
      if (order.customer_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      // Customers can only update if order is pending
      if (order.delivery_status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Cannot update order after it has been assigned'
        });
      }
      
      // Remove restricted fields for customers
      delete updateData.delivery_status;
      delete updateData.payment_status;
      delete updateData.driver_id;
    } else if (req.user.role === 'driver') {
      if (order.driver_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      // Drivers can only update delivery status
      const allowedFields = ['delivery_status'];
      Object.keys(updateData).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete updateData[key];
        }
      });
    }
    // Admin can update any field

    await order.update(updateData);

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: { order }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
};

/**
 * Assign driver to order (Admin only)
 */
const assignDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { driver_id } = req.body;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.delivery_status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Order is not in pending status'
      });
    }

    // Verify driver exists and is active
    const driver = await User.findOne({
      where: {
        id: driver_id,
        role: 'driver',
        status: 'active'
      }
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Active driver not found'
      });
    }

    await order.update({
      driver_id,
      delivery_status: 'assigned'
    });

    res.json({
      success: true,
      message: 'Driver assigned successfully',
      data: { order }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to assign driver',
      error: error.message
    });
  }
};

/**
 * Update order status
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_status, payment_status } = req.body;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Authorization checks
    if (req.user.role === 'driver') {
      if (order.driver_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      // Drivers can only update delivery status
      if (payment_status) {
        return res.status(403).json({
          success: false,
          message: 'Drivers cannot update payment status'
        });
      }
    } else if (req.user.role === 'customer') {
      // Customers cannot update status directly
      return res.status(403).json({
        success: false,
        message: 'Customers cannot update order status'
      });
    }

    const updateData = {};
    if (delivery_status) updateData.delivery_status = delivery_status;
    if (payment_status && req.user.role === 'admin') updateData.payment_status = payment_status;

    await order.update(updateData);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

/**
 * Cancel order
 */
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Authorization
    if (req.user.role === 'customer' && order.customer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if order can be cancelled
    if (['delivered', 'cancelled'].includes(order.delivery_status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled in current status'
      });
    }

    await order.update({
      delivery_status: 'cancelled'
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: { order }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
};

/**
 * Get available orders for drivers
 */
const getAvailableOrders = async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Only drivers can view available orders'
      });
    }

    const orders = await Order.findAll({
      where: {
        delivery_status: 'pending',
        driver_id: null
      },
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'full_name', 'phone'],
          foreignKey: 'customer_id'
        }
      ],
      order: [['created_at', 'ASC']]
    });

    res.json({
      success: true,
      data: { orders }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get available orders',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  assignDriver,
  updateOrderStatus,
  cancelOrder,
  getAvailableOrders
}; 