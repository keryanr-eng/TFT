import rawSynergies from "./raw/synergies.v1.json";
import type {
  ActiveSynergyState,
  RawSynergySheetRow,
  SynergyKind,
  SynergyTemplate,
  UnitTemplate,
} from "../types/gameTypes";
import { parseTiers, pickAccentColor } from "../utils/parse";
import { initials, slugify } from "../utils/slugify";

const synergyRows = rawSynergies as RawSynergySheetRow[];

export const synergyData: SynergyTemplate[] = synergyRows.map((row) => {
  const id = slugify(row.name);
  const kind: SynergyKind = row.type.toLowerCase().includes("famille") ? "family" : "trait";
  const breakpoints = parseTiers(row.tiers).map((tier, index) => {
    const effects = [row.tier1Effect, row.tier2Effect, row.tier3Effect];
    const description = effects[index] ?? "";

    return {
      tier,
      description,
      script: {
        key: `synergy.${id}.tier-${tier}`,
        description,
      },
    };
  });

  return {
    id,
    name: row.name,
    kind,
    gameplayIdentity: row.gameplayIdentity,
    isEnabled: row.status.trim().toLowerCase() === "v1",
    breakpoints,
    ui: {
      accentColor: pickAccentColor(row.name),
      iconText: initials(row.name),
    },
  };
});

export const synergyById = Object.fromEntries(
  synergyData.map((synergy) => [synergy.id, synergy]),
) as Record<string, SynergyTemplate>;

export function summarizeSynergies(units: UnitTemplate[]): ActiveSynergyState[] {
  const counts = new Map<string, number>();

  for (const unit of units) {
    counts.set(unit.familyId, (counts.get(unit.familyId) ?? 0) + 1);
    for (const traitId of unit.traitIds) {
      counts.set(traitId, (counts.get(traitId) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([synergyId, count]) => {
      const template = synergyById[synergyId];
      if (!template) {
        return null;
      }

      const activeBreakpoint = [...template.breakpoints]
        .reverse()
        .find((breakpoint) => count >= breakpoint.tier);
      const nextBreakpoint = template.breakpoints.find((breakpoint) => count < breakpoint.tier);

      return {
        synergyId,
        name: template.name,
        kind: template.kind,
        count,
        activeTier: activeBreakpoint?.tier ?? null,
        nextTier: nextBreakpoint?.tier ?? null,
        description: activeBreakpoint?.description ?? nextBreakpoint?.description ?? "",
      };
    })
    .filter((entry): entry is ActiveSynergyState => Boolean(entry))
    .sort((left, right) => {
      const rightActive = right.activeTier ?? 0;
      const leftActive = left.activeTier ?? 0;
      if (rightActive !== leftActive) {
        return rightActive - leftActive;
      }

      return right.count - left.count;
    });
}

