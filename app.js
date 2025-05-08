require('dotenv').config();

const express = require('express');
const config = require('./config/env');
const path = require('path');
const { setupApiProtection } = require('./middleware/apiProtection');

const app = express();

// Set up API protection
setupApiProtection(app);

// Explicitly check and use routers
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

// Validate routers before using
const validateRouter = (router, routeName) => {
  if (!router || typeof router.use !== 'function') {
    console.error(`Invalid router: ${routeName}`);
    return express.Router(); // Fallback to empty router
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
  res.status(500).send('Something broke!');
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
});