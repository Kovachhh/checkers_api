const { uniqBy } = require("lodash");
const { GAME_STATES } = require("../const/enum.const");
const { RESPONSES } = require("../const/response.const");
const { ApiError } = require("../exceptions/api.error");
const { GamesService } = require("../services/games.service");
const { UsersService } = require("../services/users.service");

const getGame = async (req, res) => {
    const { gameId } = req.params;

    const game = await GamesService.findOne({ _id: gameId });

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
    const gameData = await GamesService.findOne({ _id: game._id });

    res.send(gameData);
}

const endGame = async (req, res) => {
    const { userId } = req.user;
    const { gameId } = req.params;

    const game = await GamesService.findOne({ _id: gameId });

    if (!game) {
        ApiError.notFound(RESPONSES.GAME_NOT_EXIST);
    }

    await GamesService.update(gameId, { state: GAME_STATES.finished });

    if (game.state === GAME_STATE.in_progress) {
        await UsersService.update(userId, { $inc: { losses: 1 } });

        const opponentId = userId == String(game.firstPlayerId) ? String(game.secondPlayerId) : String(game.firstPlayerId);
        await UsersService.update(opponentId, { $inc: { victories: 1 } });
    }

    res.status(204).send(RESPONSES.SUCCESS);
}

const getAvailableGames = async (req, res) => {
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

    const gameData = await GamesService.findOne({ _id: gameId });

    res.send(gameData);
}

const move = async (req, res) => {
    const { userId } = req.user;
    const { gameId } = req.params;
    const { id, target } = req.body;

    let game = await GamesService.findOne({ _id: gameId });

    const opponentId = game.firstPlayerId === userId ? game.secondPlayerId : game.firstPlayerId;

    if (!game) {
        ApiError.notFound(RESPONSES.GAME_NOT_EXIST);
    }

    if (game.activePlayerId !== userId) {
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
     // check !!!!!!!!!!!!
    if (isNearMove) {
        game = await GamesService.update(gameId, { board: board.map(element => element.id === id ? { ...element, x: target.x, y: target.y }: element )});
    }

    const isAcrossMove = potentialAcrossMoves.find(element => element.x == target.x && elemenet.y == target.y);

    if(isAcrossMove) {
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

    const players = uniqBy(game.board, 'player');

    if(players.length == 1) {
        await GamesService.update(gameId, { state: GAME_STATES.finished });

        await UsersService.update(userId, { $inc: { victories: 1 } });

        await UsersService.update(opponentId, { $inc: { losses: 1 } });

        res.send(RESPONSES.GAME_OVER);
    }

    await GamesService.update(gameId, { activePlayerId: opponentId });

    const data = await GamesService.getGame({ _id: gameId });

    res.send(data);
}

module.exports = {
    GamesController: {
        getGame,
        createGame,
        endGame,
        getAvailableGames,
        getOnlineGames,
        acceptGame,
        move,
    }
}