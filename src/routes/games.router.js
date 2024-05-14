const express = require('express');

const { authMiddleware } = require('../middlewares/auth.middleware');
const { catchError } = require('../utils/catchError');
const { GamesController } = require('../controllers/games.controller');

const gamesRouter = express.Router();

gamesRouter.post('/', authMiddleware, catchError(GamesController.createGame));

gamesRouter.get('/online', authMiddleware, catchError(GamesController.getOnlineGames));

gamesRouter.get('/awaiting', authMiddleware, catchError(GamesController.getAwaitingGames));

gamesRouter.get('/:gameId', authMiddleware, catchError(GamesController.getGame));

gamesRouter.put('/:gameId/accept', authMiddleware, catchError(GamesController.acceptGame));

gamesRouter.put('/:gameId/move', authMiddleware, catchError(GamesController.move));

gamesRouter.delete('/:gameId', authMiddleware, catchError(GamesController.finishGame));

module.exports = { gamesRouter };
