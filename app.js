require('dotenv').config();

const express = require('express');
const config = require('./config/env');
const connectDB = require('./config/database');
const path = require('path');
const session = require('express-session');
const { setupApiProtection } = require('./middleware/apiProtection');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// Enhanced Security Middleware
app.use(helmet()); // Adds various HTTP headers for security
app.use(cors()); // Enable CORS for all routes
app.use(morgan('dev')); // Logging middleware for requests

// Connect to Database
connectDB();

// Set up Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_fallback_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // use secure cookies in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// User Session Middleware
app.use(async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId).select('-password');
      if (user) {
        req.user = user;
        res.locals.user = user; // make user available in all views
      }
    }
  } catch (error) {
    console.error('Session user lookup error:', error);
  }
  next();
});

// Set up API protection
setupApiProtection(app);

// Routers
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const dashboardRouter = require('./routes/dashboard'); 
const registerRouter = require('./routes/register');
const locationRoutes = require('./routes/location');
const loginRouter = require('./routes/login');
const profileRouter = require('./routes/profile');
const discoverRoutes = require('./routes/discover');

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Centralized Router Validation
const validateRouter = (router, routeName) => {
  if (!router || typeof router.use !== 'function') {
    console.warn(`Router not found or invalid: ${routeName}`);
    return express.Router(); // Fallback to prevent app crash
  }
  return router;
};

// Register routes with validation
app.use('/', validateRouter(indexRouter, 'indexRouter'));
app.use('/', validateRouter(loginRouter, 'loginRouter'));
app.use('/', validateRouter(registerRouter, 'registerRouter'));
app.use('/', validateRouter(profileRouter, 'profileRouter'));
app.use('/discover', validateRouter(discoverRoutes, 'discoverRoutes'));
app.use('/api/location', validateRouter(locationRoutes, 'locationRoutes')); 
app.use('/users', validateRouter(usersRouter, 'usersRouter'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Server Error',
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Graceful Shutdown
const shutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  app.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

// Handle termination signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
const PORT = config.port || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
});

module.exports = server; // For testing purposes