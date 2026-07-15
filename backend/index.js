const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

require('dotenv').config();
// Import Passport Google Config
require('./config/passport');

// Connect to Database
connectDB();

const app = express();

// Reconnect DB on serverless cold start if needed
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  next();
});

// API root status
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Company Management System API is running.',
    dbConnected: mongoose.connection.readyState === 1,
    env: {
      frontendUrl: Boolean(process.env.FRONTEND_URL),
      mongoUri: Boolean(process.env.MONGO_URI),
      jwtSecret: Boolean(process.env.JWT_SECRET),
      jwtRefreshSecret: Boolean(process.env.JWT_REFRESH_SECRET),
    }
  });
});

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://company-management-system-mu.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date() });
});

// Root route handler
app.get('/', (req, res) => {
  res.send('Company Management System API is running.');
});

// Centralized Error Middleware
app.use(errorHandler);

const PORT = parseInt(process.env.PORT, 10) || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app;
