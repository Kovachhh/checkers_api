const mongoose = require('mongoose');

const { GAME_STATES } = require('../const/enum.const');
const { BOARD_DEFAULT } = require('../const/board.const');
const Schema = mongoose.Schema;

const Game = new Schema(
	{
        name: { type: Schema.Types.String, required: true },
        firstPlayerId: { type: Schema.Types.ObjectId, ref: 'User' },
        secondPlayerId: { type: Schema.Types.ObjectId, ref: 'User' },
        activePlayerId: { type: Schema.Types.ObjectId, ref: 'User' },
        winnerPlayerId: { type: Schema.Types.ObjectId, ref: 'User' },
        
        state: { type: Schema.Types.String, enum: Object.values(GAME_STATES), default: GAME_STATES.waiting },
        board: { type: Schema.Types.Object, default: BOARD_DEFAULT },
    
    
        createdAt: { type: Schema.Types.Date, default: Date.now },
        updatedAt: { type: Schema.Types.Date, default: Date.now },
	}, 
);

module.exports = mongoose.model('Game', Game);