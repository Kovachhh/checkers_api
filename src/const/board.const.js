const { CHECKER_TYPE, PLAYER_TYPE } = require("./enum.const");

module.exports = {
    BOARD_DEFAULT: [
        { id: 1, x:0, y: 0, type: CHECKER_TYPE.default, player: PLAYER_TYPE.first },
        { id: 2, x:2, y: 0, type: CHECKER_TYPE.default, player: PLAYER_TYPE.first },
        { id: 3, x:4, y: 0, type: CHECKER_TYPE.default, player: PLAYER_TYPE.first },
        { id: 4, x:6, y: 0, type: CHECKER_TYPE.default, player: PLAYER_TYPE.first },
        { id: 5, x:1, y: 1, type: CHECKER_TYPE.default, player: PLAYER_TYPE.first },
        { id: 6, x:3, y: 1, type: CHECKER_TYPE.default, player: PLAYER_TYPE.first },
        { id: 7, x:5, y: 1, type: CHECKER_TYPE.default, player: PLAYER_TYPE.first },
        { id: 8, x:7, y: 1, type: CHECKER_TYPE.default, player: PLAYER_TYPE.first },
        { id: 9, x:0, y: 2, type: CHECKER_TYPE.default, player: PLAYER_TYPE.first },
        { id: 10, x:2, y: 2, type: CHECKER_TYPE.default, player: PLAYER_TYPE.first },
        { id: 11, x:4, y: 2, type: CHECKER_TYPE.default, player: PLAYER_TYPE.first },
        { id: 12, x:6, y: 2, type: CHECKER_TYPE.default, player: PLAYER_TYPE.first },

        
        { id: 13, x:1, y: 5, type: CHECKER_TYPE.default, player: PLAYER_TYPE.second },
        { id: 14, x:3, y: 5, type: CHECKER_TYPE.default, player: PLAYER_TYPE.second },
        { id: 15, x:5, y: 5, type: CHECKER_TYPE.default, player: PLAYER_TYPE.second },
        { id: 16, x:7, y: 5, type: CHECKER_TYPE.default, player: PLAYER_TYPE.second },
        { id: 17, x:0, y: 6, type: CHECKER_TYPE.default, player: PLAYER_TYPE.second },
        { id: 18, x:2, y: 6, type: CHECKER_TYPE.default, player: PLAYER_TYPE.second },
        { id: 19, x:4, y: 6, type: CHECKER_TYPE.default, player: PLAYER_TYPE.second },
        { id: 20, x:6, y: 6, type: CHECKER_TYPE.default, player: PLAYER_TYPE.second },
        { id: 21, x:1, y: 7, type: CHECKER_TYPE.default, player: PLAYER_TYPE.second },
        { id: 22, x:3, y: 7, type: CHECKER_TYPE.default, player: PLAYER_TYPE.second },
        { id: 23, x:5, y: 7, type: CHECKER_TYPE.default, player: PLAYER_TYPE.second },
        { id: 24, x:7, y: 7, type: CHECKER_TYPE.default, player: PLAYER_TYPE.second },
    ]
}