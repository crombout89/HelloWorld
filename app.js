const express = require('express');
const path = require('path');
const app = express();

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users'); 
const registerRouter = require('./routes/register');
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

// Register routes
app.use('/', indexRouter);
app.use('/', loginRouter);
app.use('/', registerRouter);
app.use('/', profileRouter);
app.use('/discover', discoverRoutes); 
app.use('/users', usersRouter);

// Start server
app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
