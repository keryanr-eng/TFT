import { createShopState } from "../systems/shopSystem";
import { createBenchSlots, createBoardSlots } from "../systems/boardSystem";
import { createStarterItemInventory } from "../systems/itemSystem";
import { createRoundState } from "./roundManager";
export const HUMAN_PLAYER_ID = "player-1";
export const NEUTRAL_PLAYER_ID = "neutral-camp";
const BOT_NAMES = [
    "Bot 1",
    "Bot 2",
    "Bot 3",
    "Bot 4",
    "Bot 5",
    "Bot 6",
    "Bot 7",
];
export const DEFAULT_BOARD = {
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
        bench: createBenchSlots(board),
        boardSlots: createBoardSlots(board),
        shop: createShopState(kind === "neutral" ? 1 : 3),
        itemInventory: kind === "human" ? createStarterItemInventory() : [],
        rosterUnitIds: [],
        isEliminated: false,
        focusSynergyId: null,
    };
}
export function createBaseGameState() {
    const players = {
        [HUMAN_PLAYER_ID]: createPlayer(HUMAN_PLAYER_ID, "Vous", "human", DEFAULT_BOARD),
        [NEUTRAL_PLAYER_ID]: createPlayer(NEUTRAL_PLAYER_ID, "Camp sauvage", "neutral", DEFAULT_BOARD),
    };
    const playerOrder = [HUMAN_PLAYER_ID];
    for (const [index, name] of BOT_NAMES.entries()) {
        const playerId = `bot-${index + 1}`;
        players[playerId] = createPlayer(playerId, name, "bot", DEFAULT_BOARD);
        playerOrder.push(playerId);
    }
    return {
        phase: "prep",
        board: DEFAULT_BOARD,
        round: createRoundState(1, NEUTRAL_PLAYER_ID, players[NEUTRAL_PLAYER_ID].name),
        humanPlayerId: HUMAN_PLAYER_ID,
        neutralPlayerId: NEUTRAL_PLAYER_ID,
        playerOrder,
        players,
        unitsById: {},
        activeSynergiesByPlayer: {},
        matchup: {
            homePlayerId: HUMAN_PLAYER_ID,
            awayPlayerId: NEUTRAL_PLAYER_ID,
            awayLabel: players[NEUTRAL_PLAYER_ID].name,
            kind: "pve",
        },
        combat: null,
        log: [],
        winnerId: null,
        nextUnitInstanceNumber: 1,
    };
}
