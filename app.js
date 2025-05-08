require('dotenv').config();

const express = require('express');
const config = require('./config/env');
const connectDB = require('./config/database');
const path = require('path');
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

// Set up API protection
setupApiProtection(app);

// Routers
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users'); 
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

// Consolidated Route Registration
const routes = [
  { path: '/', router: indexRouter, name: 'indexRouter' },
  { path: '/login', router: loginRouter, name: 'loginRouter' },
  { path: '/register', router: registerRouter, name: 'registerRouter' }, // Ensure this line is correct
  { path: '/profile', router: profileRouter, name: 'profileRouter' },
  { path: '/discover', router: discoverRoutes, name: 'discoverRoutes' },
  { path: '/api/location', router: locationRoutes, name: 'locationRoutes' },
  { path: '/users', router: usersRouter, name: 'usersRouter' }
];
// Dynamic Route Registration
routes.forEach(route => {
  app.use(route.path, validateRouter(route.router, route.name));
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).render('404', { 
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.'
  });
});

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