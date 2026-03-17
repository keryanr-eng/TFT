import { itemById } from "../src/data/itemData";
import { synergyById } from "../src/data/synergyData";
import { unitData } from "../src/data/unitData";
import {
  advanceAfterResolution,
  createNewGame,
  equipHumanItem,
  moveHumanUnit,
  startCombatPhase,
  tickCombatPhase,
} from "../src/game/gameManager";
import {
  getHumanActiveSynergies,
  getHumanBench,
  getHumanItemInventory,
  getRenderBoard,
} from "../src/game/selectors";
import { spawnRosterUnit } from "../src/game/unitFactory";
import { addUnitToBench } from "../src/systems/boardSystem";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message} (recu: ${String(actual)}, attendu: ${String(expected)})`);
  }
}

function assertDeepEqual(actual: unknown, expected: unknown, message: string): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${message} (recu: ${actualJson}, attendu: ${expectedJson})`);
  }
}

function findItemIdByName(name: string): string {
  const entry = Object.values(itemById).find((item) => item.name === name);
  assert(entry, `Item introuvable: ${name}`);
  return entry.id;
}

function findSynergyCandidate() {
  const unitsBySynergy = new Map<string, string[]>();

  for (const unit of unitData) {
    const synergyIds = [unit.familyId, ...unit.traitIds];
    for (const synergyId of synergyIds) {
      const entries = unitsBySynergy.get(synergyId) ?? [];
      entries.push(unit.id);
      unitsBySynergy.set(synergyId, entries);
    }
  }

  for (const [synergyId, unitIds] of unitsBySynergy.entries()) {
    const synergy = synergyById[synergyId];
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

let game = createNewGame();
const humanId = game.humanPlayerId;
const synergyCandidate = findSynergyCandidate();

const spawnedUnitIds = synergyCandidate.unitIds.map((templateId) => {
  const unit = spawnRosterUnit(game, humanId, templateId);
  const added = addUnitToBench(game.players[humanId], unit.id);
  assert(added, "Impossible d'ajouter l'unite de test au bench.");
  return unit.id;
});

game = moveHumanUnit(game, spawnedUnitIds[0], { type: "board", row: 0, column: 0 });
game = moveHumanUnit(game, spawnedUnitIds[1], { type: "board", row: 0, column: 1 });

const osId = findItemIdByName("Os");
const plumeId = findItemIdByName("Plume");
const boomerangId = findItemIdByName("Boomerang");

assertEqual(getHumanItemInventory(game).length, 5, "L'inventaire initial devrait contenir 5 items.");

game = equipHumanItem(game, osId, spawnedUnitIds[0]);
assertDeepEqual(game.unitsById[spawnedUnitIds[0]].items, [osId], "Le premier composant devrait etre equipe.");
assertEqual(getHumanItemInventory(game).length, 4, "Le premier equipement doit retirer l'item de l'inventaire.");

game = equipHumanItem(game, plumeId, spawnedUnitIds[0]);
assertDeepEqual(
  game.unitsById[spawnedUnitIds[0]].items,
  [boomerangId],
  "Deux composants compatibles devraient se combiner automatiquement.",
);
assertEqual(getHumanItemInventory(game).length, 3, "La combinaison doit consommer les deux composants.");

const prepBoard = getRenderBoard(game);
const equippedPrepUnit = prepBoard.find((cell) => cell.unit?.instanceId === spawnedUnitIds[0])?.unit;
assert(equippedPrepUnit, "L'unite equipee doit etre visible sur le board.");
assert(equippedPrepUnit.stats.attackDamage > 0, "Les stats de l'unite doivent etre disponibles.");
assert(equippedPrepUnit.itemBonuses.attackDamage > 0, "Le bonus d'attaque de l'item doit etre applique.");
assert(equippedPrepUnit.itemBonuses.attackSpeed > 0, "Le bonus d'attaque speed de l'item doit etre applique.");

const activeSynergy = getHumanActiveSynergies(game).find((entry) => entry.synergyId === synergyCandidate.synergyId);
assert(activeSynergy, "La synergie de test doit etre visible.");
assertEqual(activeSynergy.activeTier, synergyCandidate.firstTier, "Le premier palier de synergie doit etre actif.");
if (synergyCandidate.secondTier) {
  assertEqual(
    activeSynergy.nextTier,
    synergyCandidate.secondTier,
    "Le prochain palier de synergie doit rester lisible.",
  );
}

game = startCombatPhase(game);
assertEqual(game.phase, "combat", "Le combat doit bien demarrer.");

const combatUnit = game.combat?.units.find((unit) => unit.id === spawnedUnitIds[0]);
assert(combatUnit, "L'unite equipee doit etre presente dans la simulation de combat.");
assertDeepEqual(combatUnit.items, [boomerangId], "L'item combine doit etre present pendant le combat.");
assert(combatUnit.stats.attackDamage > 0, "Les stats de combat doivent etre calculees.");

let safety = 0;
while (game.phase === "combat" && safety < 500) {
  game = tickCombatPhase(game, 180);
  safety += 1;
}

assert(game.phase !== "combat", "Le combat doit se terminer.");
assert(safety < 500, "La simulation ne doit pas boucler indefiniment.");
assertDeepEqual(
  game.unitsById[spawnedUnitIds[0]].items,
  [boomerangId],
  "L'item doit persister apres la resolution du combat.",
);

game = advanceAfterResolution(game);
assertEqual(game.phase, "prep", "La partie doit revenir en preparation au round suivant.");
assertDeepEqual(
  game.unitsById[spawnedUnitIds[0]].items,
  [boomerangId],
  "L'item doit encore etre attache a l'unite au round suivant.",
);

const nextPrepBoard = getRenderBoard(game);
const persistedUnit = nextPrepBoard.find((cell) => cell.unit?.instanceId === spawnedUnitIds[0])?.unit;
assert(persistedUnit, "L'unite equipee doit toujours etre rendue apres la resolution.");
assertDeepEqual(persistedUnit.itemIds, [boomerangId], "Le rendu doit exposer l'item combine persistant.");

const bench = getHumanBench(game);
assert(Array.isArray(bench), "Le bench doit toujours rester lisible apres verification.");

console.log("Verification OK: items, combinaison, persistance, stats et synergies.");
