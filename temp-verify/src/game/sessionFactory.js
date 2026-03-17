"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_BOARD = exports.NEUTRAL_PLAYER_ID = exports.HUMAN_PLAYER_ID = void 0;
exports.createBaseGameState = createBaseGameState;
const shopSystem_1 = require("../systems/shopSystem");
const boardSystem_1 = require("../systems/boardSystem");
const itemSystem_1 = require("../systems/itemSystem");
const roundManager_1 = require("./roundManager");
exports.HUMAN_PLAYER_ID = "player-1";
exports.NEUTRAL_PLAYER_ID = "neutral-camp";
const BOT_NAMES = [
    "Bot 1",
    "Bot 2",
    "Bot 3",
    "Bot 4",
    "Bot 5",
    "Bot 6",
    "Bot 7",
];
exports.DEFAULT_BOARD = {
    shape: "square",
    columns: 7,
    homeRows: 2,
    awayRows: 2,
    benchSlots: 9,
};
function createPlayer(id, name, kind, board) {
    return {
        id,
        name,
        kind,
        avatar: kind === "human" ? "keeper-otter" : kind === "neutral" ? "camp" : "bot",
        health: kind === "neutral" ? 999 : 100,
        economy: {
            gold: kind === "neutral" ? 0 : 10,
            interestCap: 5,
            winStreak: 0,
            lossStreak: 0,
        },
        experience: {
            level: kind === "neutral" ? 1 : 3,
            currentXp: 0,
            xpToNext: 8,
        },
        bench: (0, boardSystem_1.createBenchSlots)(board),
        boardSlots: (0, boardSystem_1.createBoardSlots)(board),
        shop: (0, shopSystem_1.createShopState)(kind === "neutral" ? 1 : 3),
        itemInventory: kind === "human" ? (0, itemSystem_1.createStarterItemInventory)() : [],
        rosterUnitIds: [],
        isEliminated: false,
        focusSynergyId: null,
    };
}
function createBaseGameState() {
    const players = {
        [exports.HUMAN_PLAYER_ID]: createPlayer(exports.HUMAN_PLAYER_ID, "Vous", "human", exports.DEFAULT_BOARD),
        [exports.NEUTRAL_PLAYER_ID]: createPlayer(exports.NEUTRAL_PLAYER_ID, "Camp sauvage", "neutral", exports.DEFAULT_BOARD),
    };
    const playerOrder = [exports.HUMAN_PLAYER_ID];
    for (const [index, name] of BOT_NAMES.entries()) {
        const playerId = `bot-${index + 1}`;
        players[playerId] = createPlayer(playerId, name, "bot", exports.DEFAULT_BOARD);
        playerOrder.push(playerId);
    }
    return {
        phase: "prep",
        board: exports.DEFAULT_BOARD,
        round: (0, roundManager_1.createRoundState)(1, exports.NEUTRAL_PLAYER_ID, players[exports.NEUTRAL_PLAYER_ID].name),
        humanPlayerId: exports.HUMAN_PLAYER_ID,
        neutralPlayerId: exports.NEUTRAL_PLAYER_ID,
        playerOrder,
        players,
        unitsById: {},
        activeSynergiesByPlayer: {},
        matchup: {
            homePlayerId: exports.HUMAN_PLAYER_ID,
            awayPlayerId: exports.NEUTRAL_PLAYER_ID,
            awayLabel: players[exports.NEUTRAL_PLAYER_ID].name,
            kind: "pve",
        },
        combat: null,
        log: [],
        winnerId: null,
        nextUnitInstanceNumber: 1,
    };
}
