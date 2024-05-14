const SocketIO = require("socket.io");
const { get } = require("lodash");
const { GAME_ACTIONS } = require("../const/enum.const");
let io;

const init = async (app) => {
  io = SocketIO(app, {
    cors: {
      origin: "*",
    },
  });

  io.on(GAME_ACTIONS.CONNECTION, async (socket) => {
    const userId = get(socket, "handshake.query.userId", false);
    socket.join(userId);
  });
};

const sendMessageToUser = async ({ userId, event, data }) => {
  await io.sockets.to(userId).emit(event, data);
};

const sendMessageToGame = async ({ gameId, event, data }) => {
  await io.sockets.to(gameId).emit(event, data);
};

const sendMessageToAll = async ({ event, data }) => {
  await io.sockets.emit(event, data);
};

module.exports = {
  WebsocketsService: {
    init,
    sendMessageToUser,
    sendMessageToGame,
    sendMessageToAll,
  },
};
