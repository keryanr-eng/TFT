"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateActiveSynergies = evaluateActiveSynergies;
exports.evaluatePlayerSynergies = evaluatePlayerSynergies;
exports.getActiveSynergyTier = getActiveSynergyTier;
exports.hasSynergy = hasSynergy;
exports.countUnitsWithSynergy = countUnitsWithSynergy;
const synergyData_1 = require("../data/synergyData");
const unitData_1 = require("../data/unitData");
const boardSystem_1 = require("./boardSystem");
function evaluateActiveSynergies(units) {
    return (0, synergyData_1.summarizeSynergies)(units);
}
function evaluatePlayerSynergies(game, playerId) {
    const player = game.players[playerId];
    if (!player) {
        return [];
    }
    const units = (0, boardSystem_1.listBoardUnitIds)(player)
        .map((unitId) => game.unitsById[unitId])
        .filter(Boolean)
        .map((unit) => unitData_1.unitById[unit.templateId])
        .filter(Boolean);
    return (0, synergyData_1.summarizeSynergies)(units);
}
function getActiveSynergyTier(synergies, synergyId) {
    return synergies.find((entry) => entry.synergyId === synergyId)?.activeTier ?? 0;
}
function hasSynergy(synergies, synergyId, minimumTier = 1) {
    return getActiveSynergyTier(synergies, synergyId) >= minimumTier;
}
function countUnitsWithSynergy(units, synergyId) {
    return units.filter((unit) => unit.familyId === synergyId || unit.traitIds.includes(synergyId)).length;
}
