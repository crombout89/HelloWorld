const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const config = require('../config/env');

const apiLimiter = rateLimit({
  windowMs: config.apiRateWindowMs,
  max: config.apiRequestLimit,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

function setupApiProtection(app) {
  app.use(helmet({
    contentSecurityPolicy: false
  }));

  // CORS configuration
  app.use(cors({
    origin: config.nodeEnv === 'production' 
      ? ['https://yourdomain.com'] 
      : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Rate limiting for API routes
  app.use('/api/', apiLimiter);
}

module.exports = { setupApiProtection };