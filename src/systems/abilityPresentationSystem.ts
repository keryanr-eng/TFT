import { buildAbilityDetailLines, resolveAbilityData } from "./abilitySystem";
import { buildResolvedStatsWithItems } from "./itemSystem";
import type { AbilityHoverSnapshot, UnitStarLevel, UnitTemplate } from "../types/gameTypes";

const STAR_LEVELS: UnitStarLevel[] = [1, 2, 3];

export function buildAbilityHoverSnapshot(template: UnitTemplate, itemIds: string[]): AbilityHoverSnapshot {
  return {
    name: template.ability.name,
    description: template.ability.description,
    manaCost: template.ability.manaCost,
    targetingLabel: template.targetingLabel,
    tiers: STAR_LEVELS.map((starLevel) => {
      const { stats } = buildResolvedStatsWithItems(template, starLevel, itemIds);
      const resolved = resolveAbilityData(template, stats, starLevel);

      return {
        starLevel,
        lines: buildAbilityDetailLines(resolved),
      };
    }),
  };
}
