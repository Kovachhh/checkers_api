const { uniqBy } = require("lodash");
const { Types } = require("mongoose");

const {
  GAME_STATES,
  GAME_ACTIONS,
  CHECKER_TYPE,
} = require("../const/enum.const");
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
};

const createGame = async (req, res) => {
  const { userId } = req.user;
  const { name } = req.body;

  if (!name) {
    throw ApiError.badRequest(RESPONSES.VALIDATION_ERROR, {
      name: RESPONSES.NAME_REQUIRED,
    });
  }

  const game = await GamesService.create({ name, userId });
  const data = await GamesService.getGame({
    _id: new Types.ObjectId(game._id),
  });

  await WebsocketsService.sendMessageToAll({
    event: GAME_ACTIONS.CREATED,
    data,
  });

  res.send(data);
};

const finishGame = async (req, res) => {
  const { userId } = req.user;
  const { gameId } = req.params;

  const game = await GamesService.findOne({ _id: gameId });

  if (!game) {
    ApiError.notFound(RESPONSES.GAME_NOT_EXIST);
  }

  await GamesService.update(gameId, { state: GAME_STATES.finished });

  await WebsocketsService.sendMessageToAll({
    event: GAME_ACTIONS.FINISHED,
    data: { _id: gameId },
  });

  if (game.state === GAME_STATES.in_progress) {
    await UsersService.update(userId, { $inc: { losses: 1 } });
    await WebsocketsService.sendMessageToUser({
      userId,
      event: GAME_ACTIONS.LOST,
      data: {},
    });

    const opponentId =
      userId == String(game.firstPlayerId)
        ? String(game.secondPlayerId)
        : String(game.firstPlayerId);
    await UsersService.update(opponentId, { $inc: { victories: 1 } });
    await WebsocketsService.sendMessageToUser({
      userId: opponentId,
      event: GAME_ACTIONS.WON,
      data: {},
    });
  }

  res.status(204).send(RESPONSES.SUCCESS);
};

const getAwaitingGames = async (req, res) => {
  const games = await GamesService.getGamesList({ state: GAME_STATES.waiting });

  res.send(games);
};

const getOnlineGames = async (req, res) => {
  const games = await GamesService.getGamesList({
    state: GAME_STATES.in_progress,
  });

  res.send(games);
};

const acceptGame = async (req, res) => {
  const { userId } = req.user;
  const { gameId } = req.params;

  const game = await GamesService.findOne({ _id: gameId });

  if (!game) {
    ApiError.notFound(RESPONSES.GAME_NOT_EXIST);
  }

  await GamesService.update(gameId, {
    secondPlayerId: userId,
    state: GAME_STATES.in_progress,
  });

  const data = await GamesService.getGame({ _id: new Types.ObjectId(gameId) });

  await WebsocketsService.sendMessageToAll({
    event: GAME_ACTIONS.ACCEPTED,
    data,
  });

  res.send(data);
};

const findCheckerByXY = (board, x, y) => {
  return board.find((element) => element.x === x && element.y === y);
};

const checkPathClear = (board, from, to) => {
  const dx = to.x > from.x ? 1 : to.x < from.x ? -1 : 0;
  const dy = to.y > from.y ? 1 : to.y < from.y ? -1 : 0;
  const distance = Math.abs(to.x - from.x);

  for (let i = 1; i < distance; i++) {
    const checkX = from.x + dx * i;
    const checkY = from.y + dy * i;
    const cellOnPath = findCheckerByXY(board, checkX, checkY);
    if (cellOnPath) {
      return false;
    }
  }
  return true;
};

const findPossibleMoves = (
  board,
  checker,
  isAfterJump = false,
  checkedAfterJump = null
) => {
  const possibleMoves = [];
  const player = checker.player;
  const isFirstPlayer = player === "first";
  const isKing = checker.type === CHECKER_TYPE.king;

  if (checker.x < 0 || checker.x >= 8 || checker.y < 0 || checker.y >= 8) {
    return possibleMoves;
  }

  if (isKing) {
    const directions = [
      { dx: -1, dy: 1 },
      { dx: 1, dy: 1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: -1 },
    ];

    for (const dir of directions) {
      for (let i = 1; i < 8; i++) {
        const targetX = checker.x + dir.dx * i;
        const targetY = checker.y + dir.dy * i;

        if (targetX < 0 || targetX >= 8 || targetY < 0 || targetY >= 8) {
          break;
        }

        const cellContent = findCheckerByXY(board, targetX, targetY);

        if (cellContent && cellContent.player === player) {
          break;
        }

        if (!cellContent) {
          if (!isAfterJump) {
            if (checkPathClear(board, checker, { x: targetX, y: targetY })) {
              possibleMoves.push({ x: targetX, y: targetY, isJump: false });
            }
          }
        } else {
          if (cellContent.player !== player) {
            if (!checkPathClear(board, checker, { x: targetX, y: targetY })) {
              break;
            }

            const dx = targetX > checker.x ? 1 : targetX < checker.x ? -1 : 0;
            const dy = targetY > checker.y ? 1 : targetY < checker.y ? -1 : 0;

            const nextX = targetX + dx;
            const nextY = targetY + dy;

            if (nextX >= 0 && nextX < 8 && nextY >= 0 && nextY < 8) {
              const nextCell = findCheckerByXY(board, nextX, nextY);

              if (!nextCell) {
                for (let i = 1; i < 8; i++) {
                  const kingX = targetX + dx * i;
                  const kingY = targetY + dy * i;

                  if (kingX < 0 || kingX >= 8 || kingY < 0 || kingY >= 8) {
                    break;
                  }

                  const kingCell = findCheckerByXY(board, kingX, kingY);
                  if (kingCell) {
                    break;
                  }

                  const posKey = `${kingX},${kingY}`;

                  if (!checkedAfterJump || !checkedAfterJump.has(posKey)) {
                    if (checkedAfterJump) {
                      checkedAfterJump.add(posKey);
                    }

                    possibleMoves.push({
                      x: kingX,
                      y: kingY,
                      isJump: true,
                      killedX: targetX,
                      killedY: targetY,
                    });

                    const newChecker = { ...checker, x: kingX, y: kingY };
                    const furtherMoves = findPossibleMoves(
                      board,
                      newChecker,
                      true,
                      checkedAfterJump
                    );

                    furtherMoves.forEach((move) => {
                      if (move.isJump) {
                        possibleMoves.push(move);
                      }
                    });

                    if (checkedAfterJump) {
                      checkedAfterJump.delete(posKey);
                    }
                  }
                }
              }
            }
          }
          break;
        }
      }
    }
  } else {
    const forwardDirections = isFirstPlayer
      ? [
          { dx: -1, dy: 1 },
          { dx: 1, dy: 1 },
        ]
      : [
          { dx: -1, dy: -1 },
          { dx: 1, dy: -1 },
        ];

    const allDirections = [
      { dx: -1, dy: 1 },
      { dx: 1, dy: 1 },
      { dx: -1, dy: -1 },
      { dx: 1, dy: -1 },
    ];

    if (!isAfterJump) {
      for (const dir of forwardDirections) {
        const targetX = checker.x + dir.dx;
        const targetY = checker.y + dir.dy;

        if (targetX < 0 || targetX >= 8 || targetY < 0 || targetY >= 8) {
          continue;
        }

        const cellContent = findCheckerByXY(board, targetX, targetY);

        if (!cellContent) {
          possibleMoves.push({ x: targetX, y: targetY, isJump: false });
        }
      }
    }

    for (const dir of allDirections) {
      const targetX = checker.x + dir.dx;
      const targetY = checker.y + dir.dy;

      if (targetX < 0 || targetX >= 8 || targetY < 0 || targetY >= 8) {
        continue;
      }

      const cellContent = findCheckerByXY(board, targetX, targetY);

      if (cellContent && cellContent.player !== player) {
        const nextX = targetX + dir.dx;
        const nextY = targetY + dir.dy;

        if (nextX >= 0 && nextX < 8 && nextY >= 0 && nextY < 8) {
          const nextCell = findCheckerByXY(board, nextX, nextY);

          if (!nextCell) {
            const posKey = `${nextX},${nextY}`;

            if (!checkedAfterJump || !checkedAfterJump.has(posKey)) {
              if (checkedAfterJump) {
                checkedAfterJump.add(posKey);
              }

              possibleMoves.push({
                x: nextX,
                y: nextY,
                isJump: true,
                killedX: targetX,
                killedY: targetY,
              });

              const newChecker = { ...checker, x: nextX, y: nextY };
              const furtherMoves = findPossibleMoves(
                board,
                newChecker,
                true,
                checkedAfterJump
              );

              furtherMoves.forEach((move) => {
                if (move.isJump) {
                  possibleMoves.push(move);
                }
              });

              if (checkedAfterJump) {
                checkedAfterJump.delete(posKey);
              }
            }
          }
        }
      }
    }
  }

  return possibleMoves;
};

const executeMove = (board, checkerId, target, killedCheckers = []) => {
  let newBoard = [...board];

  killedCheckers.forEach((killed) => {
    newBoard = newBoard.filter(
      (element) => !(element.x === killed.x && element.y === killed.y)
    );
  });

  newBoard = newBoard.map((element) =>
    element.id === checkerId
      ? { ...element, x: target.x, y: target.y }
      : element
  );

  return newBoard;
};

const move = async (req, res) => {
  const { userId } = req.user;
  const { gameId } = req.params;
  const { id, target } = req.body;

  let game = await GamesService.findOne({ _id: gameId });

  const opponentId =
    String(game.firstPlayerId) === userId
      ? String(game.secondPlayerId)
      : String(game.firstPlayerId);

  if (!game) {
    ApiError.notFound(RESPONSES.GAME_NOT_EXIST);
  }

  if (String(game.activePlayerId) !== userId) {
    ApiError.badRequest(RESPONSES.NOT_YOUR_TURN);
  }

  const { board } = game;

  const checker = board.find((element) => element.id === id);

  if (!checker) {
    ApiError.badRequest(RESPONSES.WRONG_POSITION);
  }

  const playerType = String(game.firstPlayerId) === userId ? "first" : "second";
  if (checker.player !== playerType) {
    ApiError.badRequest(RESPONSES.WRONG_POSITION);
  }

  const targetCell = findCheckerByXY(board, target.x, target.y);
  if (targetCell) {
    ApiError.badRequest(RESPONSES.CELL_NOT_EMPTY);
  }

  const checkedAfterJump = new Set();
  const possibleMoves = findPossibleMoves(
    board,
    checker,
    false,
    checkedAfterJump
  );

  const validMove = possibleMoves.find(
    (move) => move.x === target.x && move.y === target.y
  );

  if (!validMove) {
    ApiError.badRequest(RESPONSES.BAD_TURN);
  }

  let newBoard = [...board];
  const killedCheckers = [];

  if (validMove.isJump) {
    const jumpPath = findJumpPath(
      board,
      { x: checker.x, y: checker.y },
      target
    );

    if (
      jumpPath &&
      jumpPath.killedCheckers &&
      jumpPath.killedCheckers.length > 0
    ) {
      killedCheckers.push(...jumpPath.killedCheckers);
    } else {
      if (validMove.killedX !== undefined && validMove.killedY !== undefined) {
        killedCheckers.push({ x: validMove.killedX, y: validMove.killedY });
      } else {
        const dx = target.x > checker.x ? 1 : target.x < checker.x ? -1 : 0;
        const dy = target.y > checker.y ? 1 : target.y < checker.y ? -1 : 0;
        const distance = Math.abs(target.x - checker.x);

        if (Math.abs(target.x - checker.x) === Math.abs(target.y - checker.y)) {
          for (let i = 1; i < distance; i++) {
            const checkX = checker.x + dx * i;
            const checkY = checker.y + dy * i;
            const cellContent = findCheckerByXY(board, checkX, checkY);
            if (cellContent && cellContent.player !== checker.player) {
              killedCheckers.push({ x: checkX, y: checkY });
            }
          }
        }
      }
    }

    newBoard = newBoard.filter(
      (element) =>
        !killedCheckers.some(
          (killed) => element.x === killed.x && element.y === killed.y
        )
    );
  }

  newBoard = newBoard.map((element) =>
    element.id === id ? { ...element, x: target.x, y: target.y } : element
  );

  const movedChecker = newBoard.find((element) => element.id === id);
  if (movedChecker.type === CHECKER_TYPE.default) {
    if (
      (target.y === 0 && playerType === "first") ||
      (target.y === 7 && playerType === "second")
    ) {
      movedChecker.type = CHECKER_TYPE.king;
      newBoard = newBoard.map((element) =>
        element.id === id ? { ...element, type: CHECKER_TYPE.king } : element
      );
    }
  }

  game = await GamesService.update(gameId, { board: newBoard });

  const players = uniqBy(game.board, "player");
  if (players.length === 1) {
    await GamesService.update(gameId, { state: GAME_STATES.finished });
    await WebsocketsService.sendMessageToAll({
      event: GAME_ACTIONS.FINISHED,
      data: { _id: gameId },
    });

    await UsersService.update(userId, { $inc: { victories: 1 } });
    await WebsocketsService.sendMessageToUser({
      userId,
      event: GAME_ACTIONS.WON,
      data: {},
    });

    await UsersService.update(opponentId, { $inc: { losses: 1 } });
    await WebsocketsService.sendMessageToUser({
      userId: opponentId,
      event: GAME_ACTIONS.LOST,
      data: {},
    });

    res.send(RESPONSES.GAME_OVER);
    return;
  }

  let canContinueJump = false;
  if (validMove.isJump) {
    const updatedChecker = newBoard.find((element) => element.id === id);
    const checkedAfterJumpContinue = new Set();
    const furtherMoves = findPossibleMoves(
      newBoard,
      updatedChecker,
      true,
      checkedAfterJumpContinue
    );
    canContinueJump = furtherMoves.some((move) => move.isJump);
  }

  if (!canContinueJump) {
    await GamesService.update(gameId, { activePlayerId: opponentId });
  }

  const data = await GamesService.findOne({ _id: new Types.ObjectId(gameId) });

  await WebsocketsService.sendMessageToUser({
    userId: String(game.firstPlayerId),
    event: GAME_ACTIONS.MOVED,
    data,
  });
  await WebsocketsService.sendMessageToUser({
    userId: String(game.secondPlayerId),
    event: GAME_ACTIONS.MOVED,
    data,
  });

  res.send(data);
};

module.exports = {
  GamesController: {
    getGame,
    createGame,
    finishGame,
    getAwaitingGames,
    getOnlineGames,
    acceptGame,
    move,
  },
};
