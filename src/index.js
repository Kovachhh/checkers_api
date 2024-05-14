/* eslint-disable no-console */
'use strict';

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const bodyParser = require('body-parser');
require('dotenv').config();

const { usersRouter } = require('./routes/users.router');
const { authRouter } = require('./routes/auth.router');
const { gamesRouter } = require('./routes/games.router.js');
const { errorMiddleware } = require('./middlewares/error.middleware');
const MongoDB = require('./utils/mongodb.js');
const { WebsocketsService } = require('./services/websockets.service.js');

const app = express();
const PORT = 5700;

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: 'application/*' }));
app.use(cors());

MongoDB.connect();

app.use('/', authRouter);
app.use('/users', usersRouter);
app.use('/games', gamesRouter);

app.use(errorMiddleware);

const server = http.createServer(app);
WebsocketsService.init(server);

server.listen(PORT, () => {
  console.log(`Server is running on localhost:${PORT}`);
});
