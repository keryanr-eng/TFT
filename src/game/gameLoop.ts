import { createRoundState } from "./roundManager";
import type { GamePhase, RoundState } from "../types/gameTypes";

const PHASE_ORDER: GamePhase[] = ["prep", "combat", "resolution"];

export function getNextPhase(current: GamePhase): GamePhase {
  const index = PHASE_ORDER.indexOf(current);
  if (index === -1) {
    return "prep";
  }

  return PHASE_ORDER[(index + 1) % PHASE_ORDER.length] ?? "prep";
}

export function getNextRound(
  currentRound: RoundState,
  opponentId: string,
  opponentLabel: string,
): RoundState {
  return createRoundState(currentRound.index + 1, opponentId, opponentLabel);
}
