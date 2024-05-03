const express = require('express');

const { AuthController } = require('../controllers/auth.controller');
const { catchError } = require('../utils/catchError');

const authRouter = express.Router();

authRouter.post('/registration', catchError(AuthController.register));

authRouter.post('/login', catchError(AuthController.login));

module.exports = { authRouter };
