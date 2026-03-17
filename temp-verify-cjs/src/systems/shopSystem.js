"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShopOddsForLevel = getShopOddsForLevel;
exports.chooseShopBucket = chooseShopBucket;
exports.rollShopOffer = rollShopOffer;
exports.rollShopOffers = rollShopOffers;
exports.createShopState = createShopState;
const unitData_1 = require("../data/unitData");
const progressionData_1 = require("../data/progressionData");
function randomFrom(items) {
    return items[Math.floor(Math.random() * items.length)];
}
function getShopOddsForLevel(level) {
    return progressionData_1.SHOP_ODDS_BY_LEVEL.find((entry) => entry.level === level) ?? progressionData_1.SHOP_ODDS_BY_LEVEL[0];
}
function chooseShopBucket(level) {
    const odds = getShopOddsForLevel(level).odds;
    const roll = Math.random() * 100;
    let cursor = 0;
    for (const bucket of [1, 2, 3, 4, 5]) {
        cursor += odds[bucket];
        if (roll <= cursor) {
            return bucket;
        }
    }
    return 1;
}
function rollShopOffer(level, slotIndex) {
    const oddsBucket = chooseShopBucket(level);
    const pool = unitData_1.unitIdsByCost[oddsBucket];
    const fallback = unitData_1.unitData.map((unit) => unit.id);
    const unitId = randomFrom(pool.length > 0 ? pool : fallback);
    return {
        slotIndex,
        unitId,
        cost: unitData_1.unitById[unitId]?.cost ?? oddsBucket,
        isLocked: false,
        oddsBucket,
    };
}
function rollShopOffers(level, size = 5) {
    return Array.from({ length: size }, (_, slotIndex) => rollShopOffer(level, slotIndex));
}
function createShopState(level) {
    return {
        offers: rollShopOffers(level),
        isLocked: false,
        rerollCost: 2,
        xpCost: 4,
        xpPerPurchase: 4,
    };
}
