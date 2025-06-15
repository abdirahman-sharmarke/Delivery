const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  customer_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    validate: {
      notNull: {
        msg: 'Customer ID is required'
      },
      notEmpty: {
        msg: 'Customer ID cannot be empty'
      }
    }
  },
  driver_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  pickup_address: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Pickup address is required'
      },
      notEmpty: {
        msg: 'Pickup address cannot be empty'
      },
      len: {
        args: [5, 500],
        msg: 'Pickup address must be between 5 and 500 characters'
      }
    }
  },
  pickup_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Pickup latitude is required'
      },
      min: {
        args: [-90],
        msg: 'Latitude must be between -90 and 90'
      },
      max: {
        args: [90],
        msg: 'Latitude must be between -90 and 90'
      }
    }
  },
  pickup_lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Pickup longitude is required'
      },
      min: {
        args: [-180],
        msg: 'Longitude must be between -180 and 180'
      },
      max: {
        args: [180],
        msg: 'Longitude must be between -180 and 180'
      }
    }
  },
  dropoff_address: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Dropoff address is required'
      },
      notEmpty: {
        msg: 'Dropoff address cannot be empty'
      },
      len: {
        args: [5, 500],
        msg: 'Dropoff address must be between 5 and 500 characters'
      }
    }
  },
  dropoff_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Dropoff latitude is required'
      },
      min: {
        args: [-90],
        msg: 'Latitude must be between -90 and 90'
      },
      max: {
        args: [90],
        msg: 'Latitude must be between -90 and 90'
      }
    }
  },
  dropoff_lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Dropoff longitude is required'
      },
      min: {
        args: [-180],
        msg: 'Longitude must be between -180 and 180'
      },
      max: {
        args: [180],
        msg: 'Longitude must be between -180 and 180'
      }
    }
  },
  package_description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Package description is required'
      },
      notEmpty: {
        msg: 'Package description cannot be empty'
      },
      len: {
        args: [5, 1000],
        msg: 'Package description must be between 5 and 1000 characters'
      }
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Price is required'
      },
      min: {
        args: [0.01],
        msg: 'Price must be greater than 0'
      },
      max: {
        args: [99999.99],
        msg: 'Price cannot exceed $99,999.99'
      }
    }
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed'),
    defaultValue: 'pending',
    allowNull: false,
    validate: {
      isIn: {
        args: [['pending', 'paid', 'failed']],
        msg: 'Payment status must be: pending, paid, or failed'
      }
    }
  },
  delivery_status: {
    type: DataTypes.ENUM('pending', 'assigned', 'picked', 'in_transit', 'delivered', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false,
    validate: {
      isIn: {
        args: [['pending', 'assigned', 'picked', 'in_transit', 'delivered', 'cancelled']],
        msg: 'Delivery status must be: pending, assigned, picked, in_transit, delivered, or cancelled'
      }
    }
  }
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
  indexes: [
    // Performance indexes for common queries
    {
      fields: ['customer_id']
    },
    {
      fields: ['driver_id']
    },
    {
      fields: ['delivery_status']
    },
    {
      fields: ['payment_status']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['customer_id', 'delivery_status']
    },
    {
      fields: ['driver_id', 'delivery_status']
    }
  ]
});

// Instance methods
Order.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  return values;
};

// Static methods
Order.findByCustomer = function(customerId, options = {}) {
  return this.findAll({
    where: { customer_id: customerId },
    order: [['created_at', 'DESC']],
    ...options
  });
};

Order.findByDriver = function(driverId, options = {}) {
  return this.findAll({
    where: { driver_id: driverId },
    order: [['created_at', 'DESC']],
    ...options
  });
};

Order.findByStatus = function(status, options = {}) {
  return this.findAll({
    where: { delivery_status: status },
    order: [['created_at', 'DESC']],
    ...options
  });
};

// Define associations
Order.associate = function(models) {
  // Order belongs to User as customer
  Order.belongsTo(models.User, {
    as: 'customer',
    foreignKey: 'customer_id'
  });
  
  // Order belongs to User as driver
  Order.belongsTo(models.User, {
    as: 'driver',
    foreignKey: 'driver_id'
  });
};

module.exports = Order; 