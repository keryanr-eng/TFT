import { summarizeSynergies } from "../data/synergyData";
import { unitById } from "../data/unitData";
import type {
  ActiveSynergyState,
  CombatUnitState,
  GameState,
  PlayerId,
  UnitTemplate,
} from "../types/gameTypes";
import { listBoardUnitIds } from "./boardSystem";

export function evaluateActiveSynergies(units: UnitTemplate[]) {
  return summarizeSynergies(units);
}

export function evaluatePlayerSynergies(game: GameState, playerId: PlayerId): ActiveSynergyState[] {
  const player = game.players[playerId];
  if (!player) {
    return [];
  }

  const units = listBoardUnitIds(player)
    .map((unitId) => game.unitsById[unitId])
    .filter(Boolean)
    .map((unit) => unitById[unit.templateId])
    .filter(Boolean);

  return summarizeSynergies(units);
}

export function getActiveSynergyTier(
  synergies: ActiveSynergyState[],
  synergyId: string,
): number {
  return synergies.find((entry) => entry.synergyId === synergyId)?.activeTier ?? 0;
}

export function hasSynergy(
  synergies: ActiveSynergyState[],
  synergyId: string,
  minimumTier = 1,
): boolean {
  return getActiveSynergyTier(synergies, synergyId) >= minimumTier;
}

export function countUnitsWithSynergy(units: CombatUnitState[], synergyId: string): number {
  return units.filter((unit) => unit.familyId === synergyId || unit.traitIds.includes(synergyId)).length;
}

