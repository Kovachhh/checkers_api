/* eslint-disable no-console */
'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { usersRouter } = require('./routes/users.router');
const { authRouter } = require('./routes/auth.router');
const { errorMiddleware } = require('./middlewares/error.middleware');
const MongoDB = require('./utils/mongodb.js');

const app = express();

app.use(express.json());
app.use(cookieParser());

MongoDB.connect();

app.use('/users', usersRouter);

app.use('/', authRouter);

app.use(errorMiddleware);

app.listen(5700, () => {
  console.log('Server is running on localhost:5700');
});
