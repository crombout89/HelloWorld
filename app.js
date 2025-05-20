require('dotenv').config();

const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const config = require('./config/env');
const connectDB = require('./config/database');
const Notification = require("./models/notification");
const path = require('path');
const session = require('express-session');
const { setupApiProtection } = require('./middleware/apiProtection');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const User = require('./models/user');

const app = express();

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Enhanced Security Middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(expressLayouts);
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

// User Session Middleware
app.use(async (req, res, next) => {
  try {
    if (req.session?.userId) {
      const user = await User.findById(req.session.userId).select("-password");
      if (user) {
        req.user = user;
        res.locals.user = user;
        res.locals.userId = user._id;
      }
    } else {
      res.locals.user = null;
      res.locals.userId = null;
    }
  } catch (error) {
    console.error("Session user lookup error:", error);
    res.locals.user = null;
    res.locals.userId = null;
  }

  // ✅ Safe defaults for conditional scripts/styles
  res.locals.includeLeaflet = false;
  res.locals.includeLocationClient = false;

  next();
});

// 🗺️ Maps for global access
app.use((req, res, next) => {
  res.locals.languageMap = {
    en: "🇺🇸 English",
    es: "🇪🇸 Spanish",
    fr: "🇫🇷 French",
    fa: "🇮🇷 Farsi",
    de: "🇩🇪 German",
    it: "🇮🇹 Italian",
    zh: "🇨🇳 Chinese",
    ar: "🇸🇦 Arabic",
    ru: "🇷🇺 Russian",
  };

  res.locals.emojiMap = {
    like: "👍",
    love: "❤️",
    laugh: "😂",
    wow: "😮",
    sad: "😢",
    dislike: "👎",
  };

  next();
});

const injectNotifications = require("./middleware/notifications");
app.use(injectNotifications);

// Set up API protection
setupApiProtection(app);

// Routers
const indexRouter = require('./routes/index');
const communitiesRouter = require('./routes/communities');
const dashboardRouter = require('./routes/dashboard'); 
const eventRoutes = require("./routes/events");
const registerRouter = require('./routes/register');
const locationRoutes = require("./routes/location");
const friendsRoute = require('./routes/friends');
const loginRouter = require('./routes/login');
const messagesRoute = require('./routes/messages');
const moderationRoutes = require("./routes/moderation");
const notificationsRoute = require('./routes/notifications');
const postRoutes = require("./routes/posts");
const profileRouter = require('./routes/profile');
const rssRoutes = require("./routes/rss");
const discoverRoutes = require('./routes/discover');
const translateRoute = require('./routes/api/translate');
const wallRouter = require("./routes/wall");

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('layout', 'layout'); 

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

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.userId = req.session.userId || null;

  // 🌍 Always define these so EJS doesn’t explode
  res.locals.includeLocationClient = false;
  res.locals.locationAutocompleteKey = "";
  next();
});

// Register routes with validation
app.use('/', validateRouter(indexRouter, 'indexRouter'));
app.use('/', validateRouter(registerRouter, 'registerRouter'));
app.use('/', validateRouter(profileRouter, 'profileRouter'));
app.use("/messages", messagesRoute);
app.use("/", postRoutes);
app.use('/api/translate', translateRoute);
app.use('/communities', validateRouter(communitiesRouter, 'communitiesRouter'));
app.use('/', eventRoutes);
app.use('/home', dashboardRouter);
app.use('/discover', validateRouter(discoverRoutes, 'discoverRoutes'));
app.use("/friends", friendsRoute);
app.use("/location", locationRoutes);
app.use("/login", validateRouter(loginRouter, "loginRouter"));
app.use("/notifications", notificationsRoute);
app.use("/rss", rssRoutes);
app.use(wallRouter);

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
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
app.set('io', io);

const setupSocket = require('./socket'); // ✅ your modular handler
setupSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = server;