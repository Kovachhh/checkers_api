const Game = require("../models/game.model");

const findAll = async () => {
  return await Game.find().lean();
};

const findOne = async (query) => {
  return await Game.findOne(query).lean();
};

const create = async ({ name, userId }) => {
  const game = new Game({ name: name, firstPlayerId: userId, activePlayerId: userId });
  await game.save();

  return game.toObject();
}

const update = async (id, data) => {
    return Game.findOneAndUpdate({ _id: id }, data, { new: true }).lean();
}

const remove = async (id) => {
    return Game.findByIdAndRemove({ _id: id });
}

const getGamesList = async (query) => {
    return await Game
        .aggregate()
        .match(query)
        .lookup({
            from: 'users',  
            localField: "firstPlayerId",
            foreignField: "_id",
            as: 'firstPlayer' 
        })
        .unwind({
            path: '$firstPlayer',
            preserveNullAndEmptyArrays: true
        })
        .lookup({
            from: 'users',  
            localField: "secondPlayerId",
            foreignField: "_id",
            as: 'secondPlayer' 
        })
        .unwind({
            path: '$secondPlayer',
            preserveNullAndEmptyArrays: true
        })
        .lookup({
            from: 'users',  
            localField: "activePlayerId",
            foreignField: "_id",
            as: 'activePlayer' 
        })
        .unwind({
            path: '$activePlayer',
            preserveNullAndEmptyArrays: true
        })
        .project({
            "_id": "$_id",
            "name": "$name",
            "firstPlayer": {
                username: "$firstPlayer.username",
                "_id": "$firstPlayer._id",
            },
            "secondPlayer": {
                username: "$secondPlayer.username",
                "_id": "$secondPlayer._id",
            },
            "activePlayer": {
                username: "$activePlayer.username",
                "_id": "$activePlayer._id",
            },
            "state": "$state",
            "createdAt": "$createdAt",
        })
        .sort('-createdAt');
}

const getGame = async (query) => {
    const games = await Game
        .aggregate()
        .match(query)
        .lookup({
            from: 'users',  
            localField: "firstPlayerId",
            foreignField: "_id",
            as: 'firstPlayer' 
        })
        .unwind({
            path: '$firstPlayer',
            preserveNullAndEmptyArrays: true
        })
        .lookup({
            from: 'users',  
            localField: "secondPlayerId",
            foreignField: "_id",
            as: 'secondPlayer' 
        })
        .unwind({
            path: '$secondPlayer',
            preserveNullAndEmptyArrays: true
        })
        .lookup({
            from: 'users',  
            localField: "activePlayerId",
            foreignField: "_id",
            as: 'activePlayer' 
        })
        .unwind({
            path: '$activePlayer',
            preserveNullAndEmptyArrays: true
        })
        .project({
            "_id": "$_id",
            "name": "$name",
            "firstPlayer": {
                username: "$firstPlayer.username",
                "_id": "$firstPlayer._id",
            },
            "secondPlayer": {
                username: "$secondPlayer.username",
                "_id": "$secondPlayer._id",
            },
            "activePlayer": {
                username: "$activePlayer.username",
                "_id": "$activePlayer._id",
            },
            "state": "$state",
            "createdAt": "$createdAt",
            "board": "$board",
        });

    return games[0];
}

module.exports = {
  GamesService: {
    findAll,
    findOne,
    create,
    update,
    remove,
    getGamesList,
    getGame,
  },
};
