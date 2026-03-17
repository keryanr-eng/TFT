import type { LevelProgressionRow, ShopOddsRow } from "../types/gameTypes";

export const PLAYER_LEVEL_CURVE: LevelProgressionRow[] = [
  { level: 1, xpToNext: 2, maxUnits: 1 },
  { level: 2, xpToNext: 4, maxUnits: 2 },
  { level: 3, xpToNext: 8, maxUnits: 3 },
  { level: 4, xpToNext: 12, maxUnits: 4 },
  { level: 5, xpToNext: 20, maxUnits: 5 },
  { level: 6, xpToNext: 30, maxUnits: 6 },
  { level: 7, xpToNext: 42, maxUnits: 7 },
  { level: 8, xpToNext: 58, maxUnits: 8 },
  { level: 9, xpToNext: 76, maxUnits: 9 },
  { level: 10, xpToNext: 999, maxUnits: 10 },
];

export const SHOP_ODDS_BY_LEVEL: ShopOddsRow[] = [
  { level: 1, odds: { 1: 100, 2: 0, 3: 0, 4: 0, 5: 0 } },
  { level: 2, odds: { 1: 100, 2: 0, 3: 0, 4: 0, 5: 0 } },
  { level: 3, odds: { 1: 75, 2: 25, 3: 0, 4: 0, 5: 0 } },
  { level: 4, odds: { 1: 55, 2: 30, 3: 15, 4: 0, 5: 0 } },
  { level: 5, odds: { 1: 45, 2: 33, 3: 20, 4: 2, 5: 0 } },
  { level: 6, odds: { 1: 30, 2: 40, 3: 25, 4: 5, 5: 0 } },
  { level: 7, odds: { 1: 19, 2: 35, 3: 30, 4: 15, 5: 1 } },
  { level: 8, odds: { 1: 18, 2: 25, 3: 32, 4: 22, 5: 3 } },
  { level: 9, odds: { 1: 10, 2: 20, 3: 25, 4: 35, 5: 10 } },
  { level: 10, odds: { 1: 5, 2: 10, 3: 20, 4: 40, 5: 25 } },
];

