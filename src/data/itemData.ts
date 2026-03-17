import rawItems from "./raw/items.v1.json";
import type {
  ItemComponentTemplate,
  ItemRecipeTemplate,
  RawItemSheetRow,
} from "../types/gameTypes";
import { parsePriority, parseStatModifiers } from "../utils/parse";
import { slugify } from "../utils/slugify";

const itemRows = rawItems as RawItemSheetRow[];

const componentMap = new Map<string, ItemComponentTemplate>();

for (const row of itemRows) {
  if (!row.component) {
    continue;
  }

  const id = slugify(row.component);
  if (componentMap.has(id)) {
    continue;
  }

  componentMap.set(id, {
    id,
    kind: "component",
    name: row.component,
    baseStat: row.baseStat,
    notes: row.notes,
    bonuses: parseStatModifiers(row.baseStat),
  });
}

export const itemComponents = Array.from(componentMap.values());

export const itemRecipes: ItemRecipeTemplate[] = itemRows
  .filter((row) => row.item && row.component1 && row.component2)
  .map((row) => ({
    id: slugify(row.item),
    kind: "complete",
    name: row.item,
    recipe: [slugify(row.component1), slugify(row.component2)],
    statLine: row.stats,
    effectDescription: row.simpleEffect,
    priority: parsePriority(row.priority),
    bonuses: parseStatModifiers(row.stats),
  }));

export const itemById = Object.fromEntries(
  [...itemComponents, ...itemRecipes].map((item) => [item.id, item]),
) as Record<string, ItemComponentTemplate | ItemRecipeTemplate>;

