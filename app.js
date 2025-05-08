require('dotenv').config();

const express = require('express');
const config = require('./config/env');
const connectDB = require('./config/database');
const path = require('path');
const session = require('express-session');
const { setupApiProtection } = require('./middleware/apiProtection');
const User = require('./models/user'); // Make sure to import the User model

const app = express();

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

// Explicitly check and use routers
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
app.use('/', validateRouter(registerRouter, 'registerRouter'));
app.use('/', validateRouter(profileRouter, 'profileRouter'));
app.use('/dashboard', dashboardRouter);
app.use('/discover', validateRouter(discoverRoutes, 'discoverRoutes'));
app.use('/api/location', validateRouter(locationRoutes, 'locationRoutes'));
app.use('/login', validateRouter(loginRouter, 'loginRouter')); 
app.use('/users', validateRouter(usersRouter, 'usersRouter'));

// Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
});

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