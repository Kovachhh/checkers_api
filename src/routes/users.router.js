const express = require('express');

const { UsersController } = require('../controllers/users.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { catchError } = require('../utils/catchError');

const usersRouter = express.Router();

usersRouter.get('/', authMiddleware, catchError(UsersController.getUsers));

module.exports = { usersRouter };
