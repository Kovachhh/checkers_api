module.exports = {
    GAME_STATES: {
        waiting: 'waiting',
        in_progress: 'in_progress',
        finished: 'finished',
    },

    CHECKER_TYPE: {
        default: 'default',
        king: 'king',
    },

    PLAYER_TYPE: {
        first: 'first',
        second: 'second',
    },

    GAME_ACTIONS: {
        CONNECTION: 'connection',
        CREATED: 'game-created',
        ACCEPTED: 'game-accepted',
        FINISHED: 'game-finished',
        MOVED: 'game-moved',
        LOST: 'game-lost',
        WON: 'game-won',
    },
}