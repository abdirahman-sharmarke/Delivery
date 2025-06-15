const sequelize = require('../config/database');

// Import all models
const User = require('./User');
const Order = require('./Order');

// Create models object
const models = {
  User,
  Order,
  sequelize
};

// Initialize associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models; 