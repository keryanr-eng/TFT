import { createRoundState } from "./roundManager";
const PHASE_ORDER = ["prep", "combat", "resolution"];
export function getNextPhase(current) {
    const index = PHASE_ORDER.indexOf(current);
    if (index === -1) {
        return "prep";
    }
    return PHASE_ORDER[(index + 1) % PHASE_ORDER.length] ?? "prep";
}
export function getNextRound(currentRound, opponentId, opponentLabel) {
    return createRoundState(currentRound.index + 1, opponentId, opponentLabel);
}
