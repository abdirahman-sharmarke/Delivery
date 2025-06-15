const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      is: /^[\+]?[1-9][\d]{0,15}$/
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 100]
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'driver', 'customer'),
    allowNull: false,
    defaultValue: 'customer'
  },
  profile_picture: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Supabase storage URL for profile picture'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending'),
    defaultValue: 'active'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Driver-specific fields
  vehicle_number: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isDriverField(value) {
        if (this.role === 'driver' && !value) {
          throw new Error('Vehicle number is required for drivers');
        }
      }
    }
  },
  license_number: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isDriverField(value) {
        if (this.role === 'driver' && !value) {
          throw new Error('License number is required for drivers');
        }
      }
    }
  },
  // Location tracking
  location: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Current location with latitude and longitude',
    validate: {
      isValidLocation(value) {
        if (value && (!value.latitude || !value.longitude)) {
          throw new Error('Location must include both latitude and longitude');
        }
      }
    }
  },
  // Timestamps
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

// Class methods
User.findByEmail = function(email) {
  return this.findOne({ where: { email } });
};

User.findByPhone = function(phone) {
  return this.findOne({ where: { phone } });
};

User.findActiveUsers = function() {
  return this.findAll({ where: { status: 'active' } });
};

User.findByRole = function(role) {
  return this.findAll({ where: { role } });
};

module.exports = User; 