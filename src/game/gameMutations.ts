import { unitById } from "../data/unitData";
import type { GameState, PlayerId } from "../types/gameTypes";
import { addUnitToBench, clearUnitPlacement, removeUnitFromRoster } from "../systems/boardSystem";
import { getRoundIncome, getUnitSellValue } from "../systems/economySystem";
import { resolveAutomaticUpgrades } from "../systems/fusionSystem";
import { equipItemOnUnit } from "../systems/itemSystem";
import { canBuyExperience, gainExperience } from "../systems/levelSystem";
import { rollShopOffers } from "../systems/shopSystem";
import { evaluatePlayerSynergies } from "../systems/synergySystem";
import { spawnRosterUnit } from "./unitFactory";

export function recalculatePlayerSynergies(game: GameState, playerId: PlayerId): void {
  game.activeSynergiesByPlayer[playerId] = evaluatePlayerSynergies(game, playerId);
}

export function recalculateAllSynergies(game: GameState): void {
  for (const playerId of Object.keys(game.players)) {
    recalculatePlayerSynergies(game, playerId);
  }
}

export function refreshPlayerShop(game: GameState, playerId: PlayerId, paid: boolean): boolean {
  const player = game.players[playerId];
  if (!player || player.isEliminated) {
    return false;
  }

  if (paid) {
    if (player.economy.gold < player.shop.rerollCost) {
      return false;
    }

    player.economy.gold -= player.shop.rerollCost;
  }

  player.shop.offers = rollShopOffers(player.experience.level, 5);
  return true;
}

export function buyExperienceForPlayer(game: GameState, playerId: PlayerId): boolean {
  const player = game.players[playerId];
  if (!player || !canBuyExperience(player)) {
    return false;
  }

  player.economy.gold -= player.shop.xpCost;
  player.experience = gainExperience(player.experience, player.shop.xpPerPurchase);
  return true;
}

export function equipItemForPlayer(
  game: GameState,
  playerId: PlayerId,
  unitId: string,
  itemId: string,
) {
  const player = game.players[playerId];
  if (!player || player.isEliminated) {
    return null;
  }

  if (!player.rosterUnitIds.includes(unitId)) {
    return null;
  }

  const inventoryIndex = player.itemInventory.indexOf(itemId);
  if (inventoryIndex === -1) {
    return null;
  }

  const unit = game.unitsById[unitId];
  if (!unit || unit.ownerId !== playerId) {
    return null;
  }

  const result = equipItemOnUnit(unit, itemId);
  if (!result) {
    return null;
  }

  player.itemInventory.splice(inventoryIndex, 1);
  return result;
}

export function purchaseShopOffer(game: GameState, playerId: PlayerId, slotIndex: number): boolean {
  const player = game.players[playerId];
  if (!player || player.isEliminated) {
    return false;
  }

  const offer = player.shop.offers.find((entry) => entry.slotIndex === slotIndex);
  if (!offer) {
    return false;
  }

  if (player.economy.gold < offer.cost) {
    return false;
  }

  const unit = spawnRosterUnit(game, playerId, offer.unitId);
  const added = addUnitToBench(player, unit.id);
  if (!added) {
    delete game.unitsById[unit.id];
    player.rosterUnitIds = player.rosterUnitIds.filter((unitId) => unitId !== unit.id);
    return false;
  }

  player.economy.gold -= offer.cost;
  player.shop.offers = player.shop.offers.filter((entry) => entry.slotIndex !== slotIndex);
  player.focusSynergyId = player.focusSynergyId ?? unitById[offer.unitId]?.familyId ?? null;

  resolveAutomaticUpgrades(game, playerId);
  recalculatePlayerSynergies(game, playerId);
  return true;
}

export function sellUnitForPlayer(
  game: GameState,
  playerId: PlayerId,
  unitId: string,
): { goldEarned: number; unitName: string; returnedItemIds: string[] } | null {
  const player = game.players[playerId];
  if (!player || player.isEliminated || !player.rosterUnitIds.includes(unitId)) {
    return null;
  }

  const unit = game.unitsById[unitId];
  if (!unit || unit.ownerId !== playerId) {
    return null;
  }

  const template = unitById[unit.templateId];
  if (!template) {
    return null;
  }

  const returnedItemIds = [...unit.items];
  player.itemInventory.push(...returnedItemIds);
  player.economy.gold += getUnitSellValue(template.cost, unit.starLevel);

  removeUnitFromRoster(player, unitId);
  delete game.unitsById[unitId];
  recalculatePlayerSynergies(game, playerId);

  return {
    goldEarned: getUnitSellValue(template.cost, unit.starLevel),
    unitName: template.name,
    returnedItemIds,
  };
}

export function clearPlayerArmy(game: GameState, playerId: PlayerId): void {
  const player = game.players[playerId];
  if (!player) {
    return;
  }

  for (const unitId of player.rosterUnitIds) {
    clearUnitPlacement(player, unitId);
    delete game.unitsById[unitId];
  }

  player.rosterUnitIds = [];
  player.boardSlots.forEach((slot) => {
    slot.unitInstanceId = null;
  });
  player.bench.forEach((slot) => {
    slot.unitInstanceId = null;
  });
  recalculatePlayerSynergies(game, playerId);
}

export function awardPrepIncome(game: GameState, playerId: PlayerId): void {
  const player = game.players[playerId];
  if (!player || player.kind === "neutral" || player.isEliminated) {
    return;
  }

  const income = getRoundIncome(
    player.economy.gold,
    player.economy.winStreak,
    player.economy.lossStreak,
  );
  player.economy.gold += income.total;
}
