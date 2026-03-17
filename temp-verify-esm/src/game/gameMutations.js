import { unitById } from "../data/unitData";
import { addUnitToBench, clearUnitPlacement } from "../systems/boardSystem";
import { getRoundIncome } from "../systems/economySystem";
import { resolveAutomaticUpgrades } from "../systems/fusionSystem";
import { equipItemOnUnit } from "../systems/itemSystem";
import { canBuyExperience, gainExperience } from "../systems/levelSystem";
import { rollShopOffers } from "../systems/shopSystem";
import { evaluatePlayerSynergies } from "../systems/synergySystem";
import { spawnRosterUnit } from "./unitFactory";
export function recalculatePlayerSynergies(game, playerId) {
    game.activeSynergiesByPlayer[playerId] = evaluatePlayerSynergies(game, playerId);
}
export function recalculateAllSynergies(game) {
    for (const playerId of Object.keys(game.players)) {
        recalculatePlayerSynergies(game, playerId);
    }
}
export function refreshPlayerShop(game, playerId, paid) {
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
export function buyExperienceForPlayer(game, playerId) {
    const player = game.players[playerId];
    if (!player || !canBuyExperience(player)) {
        return false;
    }
    player.economy.gold -= player.shop.xpCost;
    player.experience = gainExperience(player.experience, player.shop.xpPerPurchase);
    return true;
}
export function equipItemForPlayer(game, playerId, unitId, itemId) {
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
export function purchaseShopOffer(game, playerId, slotIndex) {
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
export function clearPlayerArmy(game, playerId) {
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
export function awardPrepIncome(game, playerId) {
    const player = game.players[playerId];
    if (!player || player.kind === "neutral" || player.isEliminated) {
        return;
    }
    const income = getRoundIncome(player.economy.gold, player.economy.winStreak, player.economy.lossStreak);
    player.economy.gold += income.total;
}
