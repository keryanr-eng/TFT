import { unitById, unitData, unitIdsByCost } from "../data/unitData";
import type { ShopOffer, ShopState, UnitCost } from "../types/gameTypes";
import { SHOP_ODDS_BY_LEVEL } from "../data/progressionData";

function randomFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function getShopOddsForLevel(level: number) {
  return SHOP_ODDS_BY_LEVEL.find((entry) => entry.level === level) ?? SHOP_ODDS_BY_LEVEL[0];
}

export function chooseShopBucket(level: number): UnitCost {
  const odds = getShopOddsForLevel(level).odds;
  const roll = Math.random() * 100;
  let cursor = 0;

  for (const bucket of [1, 2, 3, 4, 5] as UnitCost[]) {
    cursor += odds[bucket];
    if (roll <= cursor) {
      return bucket;
    }
  }

  return 1;
}

export function rollShopOffer(level: number, slotIndex: number): ShopOffer {
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

export function rollShopOffers(level: number, size = 5): ShopOffer[] {
  return Array.from({ length: size }, (_, slotIndex) => rollShopOffer(level, slotIndex));
}

export function createShopState(level: number): ShopState {
  return {
    offers: rollShopOffers(level),
    isLocked: false,
    rerollCost: 2,
    xpCost: 4,
    xpPerPurchase: 4,
  };
}

