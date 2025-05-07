const express = require('express');
const path = require('path');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users'); // Make sure this line is present

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

// Correct way to mount routers:
app.use('/', indexRouter);
app.use('/users', usersRouter); // Mount the usersRouter

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});