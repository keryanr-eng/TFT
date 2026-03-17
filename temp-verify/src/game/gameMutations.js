"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recalculatePlayerSynergies = recalculatePlayerSynergies;
exports.recalculateAllSynergies = recalculateAllSynergies;
exports.refreshPlayerShop = refreshPlayerShop;
exports.buyExperienceForPlayer = buyExperienceForPlayer;
exports.equipItemForPlayer = equipItemForPlayer;
exports.purchaseShopOffer = purchaseShopOffer;
exports.clearPlayerArmy = clearPlayerArmy;
exports.awardPrepIncome = awardPrepIncome;
const unitData_1 = require("../data/unitData");
const boardSystem_1 = require("../systems/boardSystem");
const economySystem_1 = require("../systems/economySystem");
const fusionSystem_1 = require("../systems/fusionSystem");
const itemSystem_1 = require("../systems/itemSystem");
const levelSystem_1 = require("../systems/levelSystem");
const shopSystem_1 = require("../systems/shopSystem");
const synergySystem_1 = require("../systems/synergySystem");
const unitFactory_1 = require("./unitFactory");
function recalculatePlayerSynergies(game, playerId) {
    game.activeSynergiesByPlayer[playerId] = (0, synergySystem_1.evaluatePlayerSynergies)(game, playerId);
}
function recalculateAllSynergies(game) {
    for (const playerId of Object.keys(game.players)) {
        recalculatePlayerSynergies(game, playerId);
    }
}
function refreshPlayerShop(game, playerId, paid) {
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
    player.shop.offers = (0, shopSystem_1.rollShopOffers)(player.experience.level, 5);
    return true;
}
function buyExperienceForPlayer(game, playerId) {
    const player = game.players[playerId];
    if (!player || !(0, levelSystem_1.canBuyExperience)(player)) {
        return false;
    }
    player.economy.gold -= player.shop.xpCost;
    player.experience = (0, levelSystem_1.gainExperience)(player.experience, player.shop.xpPerPurchase);
    return true;
}
function equipItemForPlayer(game, playerId, unitId, itemId) {
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
    const result = (0, itemSystem_1.equipItemOnUnit)(unit, itemId);
    if (!result) {
        return null;
    }
    player.itemInventory.splice(inventoryIndex, 1);
    return result;
}
function purchaseShopOffer(game, playerId, slotIndex) {
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
    const unit = (0, unitFactory_1.spawnRosterUnit)(game, playerId, offer.unitId);
    const added = (0, boardSystem_1.addUnitToBench)(player, unit.id);
    if (!added) {
        delete game.unitsById[unit.id];
        player.rosterUnitIds = player.rosterUnitIds.filter((unitId) => unitId !== unit.id);
        return false;
    }
    player.economy.gold -= offer.cost;
    player.shop.offers = player.shop.offers.filter((entry) => entry.slotIndex !== slotIndex);
    player.focusSynergyId = player.focusSynergyId ?? unitData_1.unitById[offer.unitId]?.familyId ?? null;
    (0, fusionSystem_1.resolveAutomaticUpgrades)(game, playerId);
    recalculatePlayerSynergies(game, playerId);
    return true;
}
function clearPlayerArmy(game, playerId) {
    const player = game.players[playerId];
    if (!player) {
        return;
    }
    for (const unitId of player.rosterUnitIds) {
        (0, boardSystem_1.clearUnitPlacement)(player, unitId);
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
function awardPrepIncome(game, playerId) {
    const player = game.players[playerId];
    if (!player || player.kind === "neutral" || player.isEliminated) {
        return;
    }
    const income = (0, economySystem_1.getRoundIncome)(player.economy.gold, player.economy.winStreak, player.economy.lossStreak);
    player.economy.gold += income.total;
}
