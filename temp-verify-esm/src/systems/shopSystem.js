import { unitById, unitData, unitIdsByCost } from "../data/unitData";
import { SHOP_ODDS_BY_LEVEL } from "../data/progressionData";
function randomFrom(items) {
    return items[Math.floor(Math.random() * items.length)];
}
export function getShopOddsForLevel(level) {
    return SHOP_ODDS_BY_LEVEL.find((entry) => entry.level === level) ?? SHOP_ODDS_BY_LEVEL[0];
}
export function chooseShopBucket(level) {
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
export function rollShopOffer(level, slotIndex) {
    const oddsBucket = chooseShopBucket(level);
    const pool = unitIdsByCost[oddsBucket];
    const fallback = unitData.map((unit) => unit.id);
    const unitId = randomFrom(pool.length > 0 ? pool : fallback);
    return {
        slotIndex,
        unitId,
        cost: unitById[unitId]?.cost ?? oddsBucket,
        isLocked: false,
        oddsBucket,
    };
}
export function rollShopOffers(level, size = 5) {
    return Array.from({ length: size }, (_, slotIndex) => rollShopOffer(level, slotIndex));
}
export function createShopState(level) {
    return {
        offers: rollShopOffers(level),
        isLocked: false,
        rerollCost: 2,
        xpCost: 4,
        xpPerPurchase: 4,
    };
}
