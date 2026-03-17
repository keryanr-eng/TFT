import { unitById } from "../data/unitData";
import type { GameState, PlayerId, UnitId, UnitInstance } from "../types/gameTypes";

export function spawnRosterUnit(game: GameState, playerId: PlayerId, templateId: UnitId): UnitInstance {
  const template = unitById[templateId];
  const unitId = `unit-${game.nextUnitInstanceNumber}`;
  game.nextUnitInstanceNumber += 1;

  const unit: UnitInstance = {
    id: unitId,
    templateId,
    ownerId: playerId,
    starLevel: 1,
    currentHealth: template?.baseStats.maxHealth ?? 0,
    currentMana: 0,
    items: [],
    position: null,
    statusEffects: [],
  };

  game.unitsById[unit.id] = unit;
  game.players[playerId].rosterUnitIds.push(unit.id);

  return unit;
}

