require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./src/config/database');
const userRoutes = require('./src/routes/userRoutes');
const orderRoutes = require('./src/routes/orderRoutes');

// Initialize models and associations
require('./src/models/index');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Delivery Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      documentation: 'See README.md for full API documentation'
    },
    status: 'Server is running successfully'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running'
  });
});

// API routes
app.use('/api', userRoutes);
app.use('/api', orderRoutes);

// Start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    await sequelize.sync();
    console.log('✅ Database synced');
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
    
  } catch (error) {
    console.error('❌ Server error:', error.message);
    process.exit(1);
  }
};

startServer();
