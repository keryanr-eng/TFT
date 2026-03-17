import { summarizeSynergies } from "../data/synergyData";
import { unitById } from "../data/unitData";
import { listBoardUnitIds } from "./boardSystem";
export function evaluateActiveSynergies(units) {
    return summarizeSynergies(units);
}
export function evaluatePlayerSynergies(game, playerId) {
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
export function getActiveSynergyTier(synergies, synergyId) {
    return synergies.find((entry) => entry.synergyId === synergyId)?.activeTier ?? 0;
}
export function hasSynergy(synergies, synergyId, minimumTier = 1) {
    return getActiveSynergyTier(synergies, synergyId) >= minimumTier;
}
export function countUnitsWithSynergy(units, synergyId) {
    return units.filter((unit) => unit.familyId === synergyId || unit.traitIds.includes(synergyId)).length;
}
