require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const signalRoutes = require('./routes/signals');
const dashboardRoutes = require('./routes/dashboard');
const journalRoutes = require('./routes/journal');
const userRoutes = require('./routes/users');
const subscriptionRoutes = require('./routes/subscriptions');
const adminRoutes = require('./routes/admin');
const testimonialRoutes = require('./routes/testimonials');
const { router: notificationRoutes } = require('./routes/notifications');
const { startCronJobs } = require('./services/signalCron');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
    ].filter(Boolean);
    if (!origin || allowed.some((u) => origin.startsWith(u))) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in dev, restrict in production if needed
    }
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/signals', signalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// Database connection & server start
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-trading-signals';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    startCronJobs();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
