import type { ResolvedUnitStats, UnitStarLevel, UnitTemplate } from "../types/gameTypes";

export interface ResolvedAbilityData {
  spellPower: number;
  damage?: {
    amount: number;
    damageType: "physical" | "magic";
    areaRadius?: number;
  };
  shield?: {
    amount: number;
    durationMs: number;
  };
  manaGain?: {
    amount: number;
  };
  attackSpeedBuff?: {
    amount: number;
    durationMs: number;
  };
  slow?: {
    amount: number;
    durationMs: number;
    areaRadius?: number;
  };
  stun?: {
    durationMs: number;
    areaRadius?: number;
  };
  poison?: {
    damagePerTick: number;
    durationMs: number;
    tickRateMs: number;
    areaRadius?: number;
  };
  summon?: {
    label: string;
    factor: number;
  };
  reposition?: "charge" | "retreat";
}

function hasOneOf(description: string, fragments: string[]): boolean {
  return fragments.some((fragment) => description.includes(fragment));
}

function valueByStar<T>(starLevel: UnitStarLevel, one: T, two: T, three: T): T {
  if (starLevel === 1) {
    return one;
  }

  if (starLevel === 2) {
    return two;
  }

  return three;
}

export function getSpellPower(stats: ResolvedUnitStats, starLevel: UnitStarLevel): number {
  return stats.attackDamage * 0.8 + stats.abilityPower * 1.35 + starLevel * 28;
}

export function resolveAbilityData(
  template: UnitTemplate,
  stats: ResolvedUnitStats,
  starLevel: UnitStarLevel,
): ResolvedAbilityData {
  const description = template.ability.description.toLowerCase();
  const spellPower = getSpellPower(stats, starLevel);

  switch (template.ability.visualStyle) {
    case "buff":
      return {
        spellPower,
        shield: description.includes("bouclier")
          ? {
              amount: Math.round(stats.maxHealth * valueByStar(starLevel, 0.22, 0.3, 0.4)),
              durationMs: valueByStar(starLevel, 3000, 3500, 4000),
            }
          : undefined,
        manaGain: description.includes("mana")
          ? {
              amount: valueByStar(starLevel, 35, 45, 60),
            }
          : undefined,
        attackSpeedBuff: {
          amount: valueByStar(starLevel, 0.25, 0.35, 0.45),
          durationMs: valueByStar(starLevel, 3000, 3500, 4000),
        },
      };
    case "pulse":
      if (description.includes("mana")) {
        return {
          spellPower,
          manaGain: {
            amount: valueByStar(starLevel, 30, 40, 55),
          },
          attackSpeedBuff: {
            amount: valueByStar(starLevel, 0.3, 0.4, 0.55),
            durationMs: valueByStar(starLevel, 3000, 3500, 4000),
          },
        };
      }

      return {
        spellPower,
        damage: {
          amount: Math.round(spellPower * 0.7),
          damageType: "magic",
          areaRadius: 1,
        },
        slow: {
          amount: valueByStar(starLevel, 0.15, 0.22, 0.3),
          durationMs: valueByStar(starLevel, 1500, 2000, 2500),
          areaRadius: 1,
        },
      };
    case "charge":
      return {
        spellPower,
        damage: {
          amount: Math.round(spellPower * 1.1),
          damageType: "physical",
        },
        stun: {
          durationMs: valueByStar(starLevel, 900, 1200, 1500),
        },
        reposition: "charge",
      };
    case "zone":
      return {
        spellPower,
        damage: {
          amount: Math.round(spellPower),
          damageType: "magic",
          areaRadius: 1,
        },
        slow: description.includes("ralent")
          ? {
              amount: valueByStar(starLevel, 0.18, 0.28, 0.4),
              durationMs: valueByStar(starLevel, 2000, 2500, 3000),
              areaRadius: 1,
            }
          : undefined,
        poison: hasOneOf(description, ["poison", "infection"])
          ? {
              damagePerTick: valueByStar(starLevel, 14, 22, 32),
              durationMs: valueByStar(starLevel, 2500, 3000, 3500),
              tickRateMs: 500,
              areaRadius: 1,
            }
          : undefined,
        stun: hasOneOf(description, ["repousse"])
          ? {
              durationMs: valueByStar(starLevel, 400, 700, 1000),
              areaRadius: 1,
            }
          : undefined,
      };
    case "summon":
      return {
        spellPower,
        damage: {
          amount: Math.round(spellPower * 0.75),
          damageType: "magic",
        },
        summon: {
          label: "Invocation",
          factor: valueByStar(starLevel, 0.42, 0.56, 0.72),
        },
      };
    case "projectile":
    default:
      return {
        spellPower,
        damage: {
          amount: Math.round(spellPower),
          damageType: "magic",
        },
        stun: hasOneOf(description, ["immobil", "etourdit", "renverse", "repousse"])
          ? {
              durationMs: valueByStar(starLevel, 650, 950, 1250),
            }
          : undefined,
        reposition: hasOneOf(description, ["repositionne", "se repositionne"]) ? "retreat" : undefined,
      };
  }
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatDuration(durationMs: number): string {
  return `${Number((durationMs / 1000).toFixed(durationMs % 1000 === 0 ? 0 : 2))}s`;
}

export function buildAbilityDetailLines(resolved: ResolvedAbilityData): string[] {
  const lines: string[] = [];

  if (resolved.damage) {
    lines.push(`${resolved.damage.amount} degats`);
  }

  if (resolved.shield) {
    lines.push(`${resolved.shield.amount} shield`);
  }

  if (resolved.manaGain) {
    lines.push(`+${resolved.manaGain.amount} mana`);
  }

  if (resolved.attackSpeedBuff) {
    lines.push(`+${formatPercent(resolved.attackSpeedBuff.amount)} vitesse d'attaque`);
  }

  if (resolved.slow) {
    lines.push(`ralentissement ${formatPercent(resolved.slow.amount)}`);
  }

  if (resolved.stun) {
    lines.push(`stun ${formatDuration(resolved.stun.durationMs)}`);
  }

  if (resolved.poison) {
    lines.push(
      `poison ${resolved.poison.damagePerTick} / ${formatDuration(resolved.poison.tickRateMs)} pendant ${formatDuration(resolved.poison.durationMs)}`,
    );
  }

  if (resolved.summon) {
    lines.push(`invoque a ${formatPercent(resolved.summon.factor)} des stats`);
  }

  if (resolved.reposition === "retreat") {
    lines.push("repositionnement apres impact");
  }

  if (resolved.reposition === "charge") {
    lines.push("charge sur la cible");
  }

  return lines;
}
