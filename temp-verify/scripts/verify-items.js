"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const itemData_1 = require("../src/data/itemData");
const synergyData_1 = require("../src/data/synergyData");
const unitData_1 = require("../src/data/unitData");
const gameManager_1 = require("../src/game/gameManager");
const selectors_1 = require("../src/game/selectors");
const unitFactory_1 = require("../src/game/unitFactory");
const boardSystem_1 = require("../src/systems/boardSystem");
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message} (recu: ${String(actual)}, attendu: ${String(expected)})`);
    }
}
function assertDeepEqual(actual, expected, message) {
    const actualJson = JSON.stringify(actual);
    const expectedJson = JSON.stringify(expected);
    if (actualJson !== expectedJson) {
        throw new Error(`${message} (recu: ${actualJson}, attendu: ${expectedJson})`);
    }
}
function findItemIdByName(name) {
    const entry = Object.values(itemData_1.itemById).find((item) => item.name === name);
    assert(entry, `Item introuvable: ${name}`);
    return entry.id;
}
function findSynergyCandidate() {
    const unitsBySynergy = new Map();
    for (const unit of unitData_1.unitData) {
        const synergyIds = [unit.familyId, ...unit.traitIds];
        for (const synergyId of synergyIds) {
            const entries = unitsBySynergy.get(synergyId) ?? [];
            entries.push(unit.id);
            unitsBySynergy.set(synergyId, entries);
        }
    }
    for (const [synergyId, unitIds] of unitsBySynergy.entries()) {
        const synergy = synergyData_1.synergyById[synergyId];
        const firstTier = synergy?.breakpoints[0]?.tier ?? 0;
        const secondTier = synergy?.breakpoints[1]?.tier ?? null;
        if (synergy && firstTier >= 2 && unitIds.length >= firstTier) {
            return {
                synergyId,
                firstTier,
                secondTier,
                unitIds: unitIds.slice(0, firstTier),
            };
        }
    }
    throw new Error("Aucune synergie testable trouvee.");
}
let game = (0, gameManager_1.createNewGame)();
const humanId = game.humanPlayerId;
const synergyCandidate = findSynergyCandidate();
const spawnedUnitIds = synergyCandidate.unitIds.map((templateId) => {
    const unit = (0, unitFactory_1.spawnRosterUnit)(game, humanId, templateId);
    const added = (0, boardSystem_1.addUnitToBench)(game.players[humanId], unit.id);
    assert(added, "Impossible d'ajouter l'unite de test au bench.");
    return unit.id;
});
game = (0, gameManager_1.moveHumanUnit)(game, spawnedUnitIds[0], { type: "board", row: 0, column: 0 });
game = (0, gameManager_1.moveHumanUnit)(game, spawnedUnitIds[1], { type: "board", row: 0, column: 1 });
const osId = findItemIdByName("Os");
const plumeId = findItemIdByName("Plume");
const boomerangId = findItemIdByName("Boomerang");
assertEqual((0, selectors_1.getHumanItemInventory)(game).length, 5, "L'inventaire initial devrait contenir 5 items.");
game = (0, gameManager_1.equipHumanItem)(game, osId, spawnedUnitIds[0]);
assertDeepEqual(game.unitsById[spawnedUnitIds[0]].items, [osId], "Le premier composant devrait etre equipe.");
assertEqual((0, selectors_1.getHumanItemInventory)(game).length, 4, "Le premier equipement doit retirer l'item de l'inventaire.");
game = (0, gameManager_1.equipHumanItem)(game, plumeId, spawnedUnitIds[0]);
assertDeepEqual(game.unitsById[spawnedUnitIds[0]].items, [boomerangId], "Deux composants compatibles devraient se combiner automatiquement.");
assertEqual((0, selectors_1.getHumanItemInventory)(game).length, 3, "La combinaison doit consommer les deux composants.");
const prepBoard = (0, selectors_1.getRenderBoard)(game);
const equippedPrepUnit = prepBoard.find((cell) => cell.unit?.instanceId === spawnedUnitIds[0])?.unit;
assert(equippedPrepUnit, "L'unite equipee doit etre visible sur le board.");
assert(equippedPrepUnit.stats.attackDamage > 0, "Les stats de l'unite doivent etre disponibles.");
assert(equippedPrepUnit.itemBonuses.attackDamage > 0, "Le bonus d'attaque de l'item doit etre applique.");
assert(equippedPrepUnit.itemBonuses.attackSpeed > 0, "Le bonus d'attaque speed de l'item doit etre applique.");
const activeSynergy = (0, selectors_1.getHumanActiveSynergies)(game).find((entry) => entry.synergyId === synergyCandidate.synergyId);
assert(activeSynergy, "La synergie de test doit etre visible.");
assertEqual(activeSynergy.activeTier, synergyCandidate.firstTier, "Le premier palier de synergie doit etre actif.");
if (synergyCandidate.secondTier) {
    assertEqual(activeSynergy.nextTier, synergyCandidate.secondTier, "Le prochain palier de synergie doit rester lisible.");
}
game = (0, gameManager_1.startCombatPhase)(game);
assertEqual(game.phase, "combat", "Le combat doit bien demarrer.");
const combatUnit = game.combat?.units.find((unit) => unit.id === spawnedUnitIds[0]);
assert(combatUnit, "L'unite equipee doit etre presente dans la simulation de combat.");
assertDeepEqual(combatUnit.items, [boomerangId], "L'item combine doit etre present pendant le combat.");
assert(combatUnit.stats.attackDamage > 0, "Les stats de combat doivent etre calculees.");
let safety = 0;
while (game.phase === "combat" && safety < 500) {
    game = (0, gameManager_1.tickCombatPhase)(game, 180);
    safety += 1;
}
assert(game.phase !== "combat", "Le combat doit se terminer.");
assert(safety < 500, "La simulation ne doit pas boucler indefiniment.");
assertDeepEqual(game.unitsById[spawnedUnitIds[0]].items, [boomerangId], "L'item doit persister apres la resolution du combat.");
game = (0, gameManager_1.advanceAfterResolution)(game);
assertEqual(game.phase, "prep", "La partie doit revenir en preparation au round suivant.");
assertDeepEqual(game.unitsById[spawnedUnitIds[0]].items, [boomerangId], "L'item doit encore etre attache a l'unite au round suivant.");
const nextPrepBoard = (0, selectors_1.getRenderBoard)(game);
const persistedUnit = nextPrepBoard.find((cell) => cell.unit?.instanceId === spawnedUnitIds[0])?.unit;
assert(persistedUnit, "L'unite equipee doit toujours etre rendue apres la resolution.");
assertDeepEqual(persistedUnit.itemIds, [boomerangId], "Le rendu doit exposer l'item combine persistant.");
const bench = (0, selectors_1.getHumanBench)(game);
assert(Array.isArray(bench), "Le bench doit toujours rester lisible apres verification.");
console.log("Verification OK: items, combinaison, persistance, stats et synergies.");
