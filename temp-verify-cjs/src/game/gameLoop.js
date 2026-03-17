"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextPhase = getNextPhase;
exports.getNextRound = getNextRound;
const roundManager_1 = require("./roundManager");
const PHASE_ORDER = ["prep", "combat", "resolution"];
function getNextPhase(current) {
    const index = PHASE_ORDER.indexOf(current);
    if (index === -1) {
        return "prep";
    }
    return PHASE_ORDER[(index + 1) % PHASE_ORDER.length] ?? "prep";
}
function getNextRound(currentRound, opponentId, opponentLabel) {
    return (0, roundManager_1.createRoundState)(currentRound.index + 1, opponentId, opponentLabel);
}
