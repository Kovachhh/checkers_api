const { uniqBy } = require("lodash");
const { Types } = require("mongoose");

const { GAME_STATES, GAME_ACTIONS, CHECKER_TYPE } = require("../const/enum.const");
const { RESPONSES } = require("../const/response.const");
const { ApiError } = require("../exceptions/api.error");
const { GamesService } = require("../services/games.service");
const { UsersService } = require("../services/users.service");
const { WebsocketsService } = require("../services/websockets.service");

const getGame = async (req, res) => {
    const { gameId } = req.params;

    const game = await GamesService.findOne({ _id: new Types.ObjectId(gameId) });

    if (!game) {
        ApiError.notFound(RESPONSES.GAME_NOT_EXIST);
    }

    res.send(game);
}

const createGame = async (req, res) => {
    const { userId } = req.user;
    const { name } = req.body;

    if (!name) {
        throw ApiError.badRequest(RESPONSES.VALIDATION_ERROR, { name: RESPONSES.NAME_REQUIRED });
    }

    const game = await GamesService.create({ name, userId });
    const data = await GamesService.getGame({ _id: new Types.ObjectId(game._id) });

    await WebsocketsService.sendMessageToAll({ event: GAME_ACTIONS.CREATED, data });

    res.send(data);
}

const finishGame = async (req, res) => {
    const { userId } = req.user;
    const { gameId } = req.params;

    const game = await GamesService.findOne({ _id: gameId });

    if (!game) {
        ApiError.notFound(RESPONSES.GAME_NOT_EXIST);
    }

    await GamesService.update(gameId, { state: GAME_STATES.finished });

    await WebsocketsService.sendMessageToAll({ event: GAME_ACTIONS.FINISHED, data: { _id: gameId } });

    if (game.state === GAME_STATES.in_progress) {
        await UsersService.update(userId, { $inc: { losses: 1 } });
        await WebsocketsService.sendMessageToUser({ userId, event: GAME_ACTIONS.LOST, data: {} });

        const opponentId = userId == String(game.firstPlayerId) ? String(game.secondPlayerId) : String(game.firstPlayerId);
        await UsersService.update(opponentId, { $inc: { victories: 1 } });
        await WebsocketsService.sendMessageToUser({ userId: opponentId, event: GAME_ACTIONS.WON, data: {} });
    }

    res.status(204).send(RESPONSES.SUCCESS);
}

const getAwaitingGames = async (req, res) => {
    const games = await GamesService.getGamesList({ state: GAME_STATES.waiting });

    res.send(games);
}

const getOnlineGames = async (req, res) => {
    const games = await GamesService.getGamesList({ state: GAME_STATES.in_progress });

    res.send(games);
}

const acceptGame = async (req, res) => {
    const { userId } = req.user;
    const { gameId } = req.params;

    const game = await GamesService.findOne({ _id: gameId });

    if (!game) {
        ApiError.notFound(RESPONSES.GAME_NOT_EXIST);
    }

    await GamesService.update(gameId, { secondPlayerId: userId, state: GAME_STATES.in_progress });

    const data = await GamesService.getGame({ _id: new Types.ObjectId(gameId) });

    await WebsocketsService.sendMessageToAll({ event: GAME_ACTIONS.ACCEPTED, data });

    res.send(data);
}

const move = async (req, res) => {
    const { userId } = req.user;
    const { gameId } = req.params;
    const { id, target } = req.body;

    let game = await GamesService.findOne({ _id: gameId });

    const opponentId = String(game.firstPlayerId) === userId ? String(game.secondPlayerId) : String(game.firstPlayerId);

    if (!game) {
        ApiError.notFound(RESPONSES.GAME_NOT_EXIST);
    }

    if (String(game.activePlayerId) !== userId) {
        ApiError.badRequest(RESPONSES.NOT_YOUR_TURN);
    }

    const { board } = game;

    const checker = board.find(element => element.id === id);

    if (!checker) {
        ApiError.badRequest(RESPONSES.WRONG_POSITION);
    }

    const cell = board.find(element => element.x == target.x && element.y == target.y);

    if (cell) {
        ApiError.badRequest(RESPONSES.CELL_NOT_EMPTY);
    }

    const potentialNearMoves = [
        { x: checker.x - 1 , y: checker.y - 1 },
        { x: checker.x + 1 , y: checker.y - 1 },
        { x: checker.x - 1 , y: checker.y + 1 },
        { x: checker.x + 1 , y: checker.y + 1 },
    ];

    const potentialAcrossMoves = [
        { x: checker.x - 2 , y: checker.y - 2 },
        { x: checker.x + 2 , y: checker.y - 2 },
        { x: checker.x - 2 , y: checker.y + 2 },
        { x: checker.x + 2 , y: checker.y + 2 },
    ];

    const isNearMove = potentialNearMoves.find(element => element.x == target.x && element.y == target.y);

    if (isNearMove) {
        game = await GamesService.update(gameId, { board: board.map(element => element.id === id ? { ...element, x: target.x, y: target.y }: element )});
    }

    const isAcrossMove = potentialAcrossMoves.find(element => element.x == target.x && element.y == target.y);

    if (isAcrossMove) {
        const kill = { 
            x: target.x > checker.x ? checker.x + 1 : checker.x - 1, 
            y: target.y > checker.y ? checker.y + 1 : checker.y - 1,
        };

        const opponent = board.find(element => element.x == kill.x && element.y == kill.y);

        if(!opponent) {
            ApiError.badRequest(RESPONSES.BAD_TURN);
        }

        game = await GamesService.update(gameId, { board: board.filter(element => !(element.x == kill.x && element.y == kill.y)).map(element => element.id === id ? { ...element, x: target.x, y: target.y } : element ) });
    }

    if ((target.y === 0 && userId === String(game.firstPlayerId)) || (target.y === 7 && userId === String(game.secondPlayerId))) {
        game = await GamesService.update(gameId, { board: board.map(element => element.id === id ? { ...element, x: target.x, y: target.y, type: CHECKER_TYPE.king }: element )});
    }

    const players = uniqBy(game.board, 'player');

    if (players.length === 1) {
        await GamesService.update(gameId, { state: GAME_STATES.finished });
        await WebsocketsService.sendMessageToAll({ event: GAME_ACTIONS.FINISHED, data: { _id: gameId } });

        await UsersService.update(userId, { $inc: { victories: 1 } });
        await WebsocketsService.sendMessageToUser({ userId, event: GAME_ACTIONS.WON, data: {} });

        await UsersService.update(opponentId, { $inc: { losses: 1 } });
        await WebsocketsService.sendMessageToUser({ userId: opponentId, event: GAME_ACTIONS.LOST, data: {} });

        res.send(RESPONSES.GAME_OVER);
    }

    await GamesService.update(gameId, { activePlayerId: opponentId });

    const data = await GamesService.findOne({ _id: new Types.ObjectId(gameId)});

    await WebsocketsService.sendMessageToUser({ userId: String(game.firstPlayerId), event: GAME_ACTIONS.MOVED, data });
    await WebsocketsService.sendMessageToUser({ userId: String(game.secondPlayerId), event: GAME_ACTIONS.MOVED, data });

    res.send(data);
}

module.exports = {
    GamesController: {
        getGame,
        createGame,
        finishGame,
        getAwaitingGames,
        getOnlineGames,
        acceptGame,
        move,
    }
}