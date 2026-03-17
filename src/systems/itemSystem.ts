import { itemById, itemComponents, itemRecipes } from "../data/itemData";
import type {
  HoverStatsSnapshot,
  ItemId,
  ItemRecipeTemplate,
  ResolvedUnitStats,
  StatKey,
  UnitInstance,
  UnitStarLevel,
  UnitTemplate,
} from "../types/gameTypes";

const MAX_UNIT_ITEM_SLOTS = 3;

type ItemModifierBucket = Record<StatKey, { flat: number; percent: number }>;

function getStarHealthMultiplier(starLevel: UnitStarLevel): number {
  if (starLevel === 2) {
    return 1.8;
  }

  if (starLevel === 3) {
    return 3.1;
  }

  return 1;
}

function getStarDamageMultiplier(starLevel: UnitStarLevel): number {
  if (starLevel === 2) {
    return 1.65;
  }

  if (starLevel === 3) {
    return 2.45;
  }

  return 1;
}

function createModifierBucket(): ItemModifierBucket {
  return {
    health: { flat: 0, percent: 0 },
    attackDamage: { flat: 0, percent: 0 },
    abilityPower: { flat: 0, percent: 0 },
    armor: { flat: 0, percent: 0 },
    magicResist: { flat: 0, percent: 0 },
    attackSpeed: { flat: 0, percent: 0 },
    critChance: { flat: 0, percent: 0 },
    startingMana: { flat: 0, percent: 0 },
    moveSpeed: { flat: 0, percent: 0 },
    range: { flat: 0, percent: 0 },
  };
}

export function createEmptyHoverStatsSnapshot(): HoverStatsSnapshot {
  return {
    maxHealth: 0,
    maxMana: 0,
    startingMana: 0,
    attackDamage: 0,
    abilityPower: 0,
    armor: 0,
    magicResist: 0,
    attackSpeed: 0,
    critChance: 0,
    moveSpeed: 0,
    range: 0,
  };
}

function accumulateModifiers(itemIds: ItemId[]): ItemModifierBucket {
  const bucket = createModifierBucket();

  for (const itemId of itemIds) {
    const item = itemById[itemId];
    if (!item) {
      continue;
    }

    for (const bonus of item.bonuses) {
      if (bonus.mode === "flat") {
        bucket[bonus.stat].flat += bonus.value;
      } else {
        bucket[bonus.stat].percent += bonus.value;
      }
    }
  }

  return bucket;
}

function applyScaledStat(base: number, modifier: { flat: number; percent: number }, precision = 0): number {
  const scaled = (base + modifier.flat) * (1 + modifier.percent / 100);
  if (precision > 0) {
    return Number(scaled.toFixed(precision));
  }

  return Math.round(scaled);
}

function applyAdditivePercent(base: number, modifier: { flat: number; percent: number }, precision = 2): number {
  return Number((base + modifier.flat + modifier.percent / 100).toFixed(precision));
}

function isComponentItem(itemId: ItemId): boolean {
  return itemById[itemId]?.kind === "component";
}

export function createStarterItemInventory(): ItemId[] {
  return itemComponents.slice(0, 5).map((item) => item.id);
}

export function combineItems(componentA: ItemId, componentB: ItemId): ItemRecipeTemplate | null {
  const left = itemById[componentA];
  const right = itemById[componentB];
  if (!left || !right || left.kind !== "component" || right.kind !== "component") {
    return null;
  }

  const sortedPair = [left.id, right.id].sort().join(":");
  return itemRecipes.find((recipe) => recipe.recipe.slice().sort().join(":") === sortedPair) ?? null;
}

export interface ItemCombinationEvent {
  consumed: [ItemId, ItemId];
  result: ItemId;
}

export interface ItemCombinationResult {
  items: ItemId[];
  combinations: ItemCombinationEvent[];
}

export function resolveItemCombinations(itemIds: ItemId[]): ItemCombinationResult {
  const nextItems = [...itemIds];
  const combinations: ItemCombinationEvent[] = [];

  let combined = true;
  while (combined) {
    combined = false;

    for (let leftIndex = 0; leftIndex < nextItems.length; leftIndex += 1) {
      const leftId = nextItems[leftIndex];
      if (!isComponentItem(leftId)) {
        continue;
      }

      for (let rightIndex = leftIndex + 1; rightIndex < nextItems.length; rightIndex += 1) {
        const rightId = nextItems[rightIndex];
        if (!isComponentItem(rightId)) {
          continue;
        }

        const recipe = combineItems(leftId, rightId);
        if (!recipe) {
          continue;
        }

        nextItems.splice(rightIndex, 1);
        nextItems.splice(leftIndex, 1, recipe.id);
        combinations.push({
          consumed: [leftId, rightId],
          result: recipe.id,
        });
        combined = true;
        break;
      }

      if (combined) {
        break;
      }
    }
  }

  return {
    items: nextItems,
    combinations,
  };
}

export function buildBaseResolvedStats(template: UnitTemplate, starLevel: UnitStarLevel): ResolvedUnitStats {
  return {
    maxHealth: Math.round(template.baseStats.maxHealth * getStarHealthMultiplier(starLevel)),
    attackDamage: Math.round(template.baseStats.attackDamage * getStarDamageMultiplier(starLevel)),
    abilityPower: template.baseStats.abilityPower + (starLevel - 1) * 18,
    armor: template.baseStats.armor + (starLevel - 1) * 8,
    magicResist: template.baseStats.magicResist + (starLevel - 1) * 8,
    attackSpeed: Number((template.baseStats.attackSpeed * (1 + (starLevel - 1) * 0.08)).toFixed(2)),
    moveSpeed: Number(template.baseStats.moveSpeed.toFixed(2)),
    critChance: Number(template.baseStats.critChance.toFixed(2)),
    manaGainPerAttack: template.baseStats.manaGainPerAttack,
    range: template.range,
    maxMana: template.maxMana,
    startingMana: 0,
    critDamage: 1.5,
  };
}

export function applyItemBonusesToStats(
  baseStats: ResolvedUnitStats,
  itemIds: ItemId[],
): { stats: ResolvedUnitStats; itemBonuses: HoverStatsSnapshot } {
  const modifiers = accumulateModifiers(itemIds);

  const nextStats: ResolvedUnitStats = {
    ...baseStats,
    maxHealth: Math.max(1, applyScaledStat(baseStats.maxHealth, modifiers.health)),
    attackDamage: Math.max(1, applyScaledStat(baseStats.attackDamage, modifiers.attackDamage)),
    abilityPower: applyScaledStat(baseStats.abilityPower, modifiers.abilityPower),
    armor: applyScaledStat(baseStats.armor, modifiers.armor),
    magicResist: applyScaledStat(baseStats.magicResist, modifiers.magicResist),
    attackSpeed: Math.max(0.35, applyScaledStat(baseStats.attackSpeed, modifiers.attackSpeed, 2)),
    moveSpeed: Math.max(0.45, applyScaledStat(baseStats.moveSpeed, modifiers.moveSpeed, 2)),
    critChance: Math.max(0, applyAdditivePercent(baseStats.critChance, modifiers.critChance)),
    range: Math.max(1, applyScaledStat(baseStats.range, modifiers.range)),
    maxMana: Math.max(0, applyScaledStat(baseStats.maxMana, { flat: 0, percent: 0 })),
    startingMana: Math.max(0, baseStats.startingMana + modifiers.startingMana.flat),
    manaGainPerAttack: baseStats.manaGainPerAttack,
    critDamage: baseStats.critDamage,
  };

  return {
    stats: nextStats,
    itemBonuses: {
      maxHealth: nextStats.maxHealth - baseStats.maxHealth,
      maxMana: nextStats.maxMana - baseStats.maxMana,
      startingMana: nextStats.startingMana - baseStats.startingMana,
      attackDamage: nextStats.attackDamage - baseStats.attackDamage,
      abilityPower: nextStats.abilityPower - baseStats.abilityPower,
      armor: nextStats.armor - baseStats.armor,
      magicResist: nextStats.magicResist - baseStats.magicResist,
      attackSpeed: Number((nextStats.attackSpeed - baseStats.attackSpeed).toFixed(2)),
      critChance: Number((nextStats.critChance - baseStats.critChance).toFixed(2)),
      moveSpeed: Number((nextStats.moveSpeed - baseStats.moveSpeed).toFixed(2)),
      range: nextStats.range - baseStats.range,
    },
  };
}

export function buildResolvedStatsWithItems(
  template: UnitTemplate,
  starLevel: UnitStarLevel,
  itemIds: ItemId[],
): { stats: ResolvedUnitStats; itemBonuses: HoverStatsSnapshot } {
  return applyItemBonusesToStats(buildBaseResolvedStats(template, starLevel), itemIds);
}

export function equipItemOnUnit(unit: UnitInstance, itemId: ItemId): ItemCombinationResult | null {
  if (unit.items.length >= MAX_UNIT_ITEM_SLOTS) {
    return null;
  }

  const equipped = resolveItemCombinations([...unit.items, itemId]);
  if (equipped.items.length > MAX_UNIT_ITEM_SLOTS) {
    return null;
  }

  unit.items = equipped.items;
  return equipped;
}

export function collapseItemsForUpgrade(itemIds: ItemId[]): ItemId[] {
  return resolveItemCombinations(itemIds).items.slice(0, MAX_UNIT_ITEM_SLOTS);
}

export function getMaxUnitItemSlots(): number {
  return MAX_UNIT_ITEM_SLOTS;
}
