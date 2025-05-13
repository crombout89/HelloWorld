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
const User = require('./models/user');

const app = express();

// Enhanced Security Middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors()); 
app.use(morgan('dev'));

app.post('/csp-report', (req, res) => {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    console.log('CSP Violation Report:', body);
    res.status(204).end();
  });
});

// Connect to Database
connectDB();

// Set up Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_fallback_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 
  }
}));
// temp logIn session 
app.use((req, res, next) => {
  if (!req.session.userId) {
    req.session.userId = '664245d013fb80f9d8123456'; // use an actual _id from your MongoDB if available
    req.session.user = {
      username: 'fereshteh',
      email: 'fereshteh@example.com',
      createdAt: new Date(),
      interests: ['coding', 'music'],
      preferences: ['language exchange'],
      name: 'Fereshteh Aghaarabi',
      bio: 'Testing profile page',
      photo: ''
    };
  }
  next();
});




// User Session Middleware
app.use(async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId).select('-password');
      if (user) {
        req.user = user;
        res.locals.user = user;
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
const communitiesRouter = require('./routes/communities');
const createEventRoutes = require('./routes/create-event');
const dashboardRouter = require('./routes/dashboard'); 
const registerRouter = require('./routes/register');
const locationRoutes = require('./routes/location');
const geolocationRoutes = require('./routes/geolocation');
const loginRouter = require('./routes/login');
const messagesRoute = require('./routes/messages');
const notificationsRoute = require('./routes/notifications');
const profileRouter = require('./routes/profile');
const discoverRoutes = require('./routes/discover');
const translateRoute = require('./routes/api/translate');

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Serve static files with proper MIME types
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.js') {
      res.setHeader('Content-Type', 'application/javascript');
      // Allow module scripts
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
    if (path.extname(filePath) === '.mjs') {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Additional route for explicitly serving JavaScript files
app.get('/js/location.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(path.join(__dirname, 'public/js/location.js'));
});

app.get('/js/dashboard.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(path.join(__dirname, 'public/js/dashboard.js'));
});

// Centralized Router Validation
const validateRouter = (router, routeName) => {
  if (!router || typeof router.use !== 'function') {
    console.warn(`Router not found or invalid: ${routeName}`);
    return express.Router(); 
  }
  return router;
};

// Register routes with validation
app.use('/', validateRouter(indexRouter, 'indexRouter'));
app.use('/', validateRouter(registerRouter, 'registerRouter'));
app.use('/', validateRouter(profileRouter, 'profileRouter'));
app.use('/', messagesRoute); 
app.use('/api/translate', translateRoute);
app.use('/communities', validateRouter(communitiesRouter, 'communitiesRouter'));
app.use('/create-event', createEventRoutes);
app.use('/dashboard', dashboardRouter);
app.use('/discover', validateRouter(discoverRoutes, 'discoverRoutes'));
app.use('/api/geolocation', geolocationRoutes);
app.use('/api/location', validateRouter(locationRoutes, 'locationRoutes'));
app.use('/login', validateRouter(loginRouter, 'loginRouter'));
app.use('/notifications', notificationsRoute);
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

module.exports = server;