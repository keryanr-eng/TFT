import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { itemById } from "../../data/itemData";
import type { RenderUnitState } from "../../game/selectors";
import { resolveAbilityData } from "../../systems/abilitySystem";
import { buildResolvedStatsWithItems } from "../../systems/itemSystem";
import type { UnitStarLevel } from "../../types/gameTypes";
import { initials } from "../../utils/slugify";
import { withAlpha } from "../accent";

interface UnitStatsPanelProps {
  unit: RenderUnitState | null;
  equippedItemIds: string[];
  className?: string;
  isPinned?: boolean;
  onClearPin?: () => void;
  onHoverChange?: (isHovered: boolean) => void;
}

interface SpellTooltipPosition {
  left: number;
  top: number;
}

interface AbilityScalingRow {
  label: string;
  values: Array<string | null>;
  accentClass: string;
}

const STAR_LEVELS: UnitStarLevel[] = [1, 2, 3];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatDuration(durationMs: number): string {
  const seconds = durationMs / 1000;
  const digits = durationMs % 1000 === 0 ? 0 : 1;
  return `${seconds.toFixed(digits)}s`;
}

function formatBonus(value: number, digits = 0): string | null {
  if (value <= 0) {
    return null;
  }

  const rounded = digits > 0 ? value.toFixed(digits) : Math.round(value).toString();
  return `+${rounded} item`;
}

function StatRow({
  label,
  value,
  toneClass,
  bonusLabel,
}: {
  label: string;
  value: string | number;
  toneClass: string;
  bonusLabel?: string | null;
}) {
  return (
    <div className={`rounded-[0.85rem] border px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${toneClass}`}>
      <div className="flex items-center justify-between gap-2 text-[10px]">
        <span className="font-semibold uppercase tracking-[0.12em]">{label}</span>
        <span className="font-display text-[15px] leading-none text-slate-50">{value}</span>
      </div>
      {bonusLabel ? <p className="mt-0.5 text-[9px] font-semibold opacity-75">{bonusLabel}</p> : null}
    </div>
  );
}

function getAbilityTypeLabel(unit: RenderUnitState): string {
  const starLevel = unit.starLevel as UnitStarLevel;
  const resolved = resolveAbilityData(
    unit.template,
    buildResolvedStatsWithItems(unit.template, starLevel, unit.itemIds).stats,
    starLevel,
  );

  if (resolved.damage?.damageType === "magic") {
    return "Magique";
  }

  if (resolved.damage?.damageType === "physical") {
    return "Physique";
  }

  if (resolved.shield) {
    return "Bouclier";
  }

  if (resolved.summon) {
    return "Invocation";
  }

  return "Utilitaire";
}

function getAbilityIcon(unit: RenderUnitState): string {
  switch (unit.template.ability.visualStyle) {
    case "projectile":
      return "\u2726";
    case "pulse":
      return "\u25C9";
    case "charge":
      return "\u27A4";
    case "buff":
      return "\u2B22";
    case "summon":
      return "\u2737";
    case "zone":
      return "\u25CE";
    default:
      return "\u2726";
  }
}

function extractScalingValues(tiers: RenderUnitState["ability"]["tiers"], pattern: RegExp): Array<string | null> {
  return tiers.map((tier) => {
    const matchingLine = tier.lines.find((line) => pattern.test(line.toLowerCase()));
    if (!matchingLine) {
      return null;
    }

    const valueMatch = matchingLine.match(/\d+[.,]?\d*/);
    return valueMatch?.[0] ?? matchingLine;
  });
}

function ScalingValuesRow({
  label,
  values,
  activeStarLevel,
  accentClass,
}: {
  label: string;
  values: Array<string | null>;
  activeStarLevel: number;
  accentClass: string;
}) {
  if (!values.some(Boolean)) {
    return null;
  }

  return (
    <p>
      <span className="font-semibold text-slate-100">{label} :</span>{" "}
      {values.map((value, index) => {
        const starLevel = index + 1;
        const isActive = starLevel === activeStarLevel;

        return (
          <span key={`${label}-${starLevel}`}>
            <span
              className={clsx(
                "font-semibold transition-colors",
                isActive ? accentClass : "text-slate-500",
              )}
            >
              {value ?? "-"}
            </span>
            {index < values.length - 1 ? <span className="px-1 text-slate-600">/</span> : null}
          </span>
        );
      })}
    </p>
  );
}

function buildAbilityScalingRows(unit: RenderUnitState): AbilityScalingRow[] {
  const resolvedByStar = STAR_LEVELS.map((starLevel) => {
    const { stats } = buildResolvedStatsWithItems(unit.template, starLevel, unit.itemIds);
    return resolveAbilityData(unit.template, stats, starLevel);
  });

  const rows: AbilityScalingRow[] = [];

  const pushRow = (
    label: string,
    accentClass: string,
    formatter: (resolved: (typeof resolvedByStar)[number]) => string | null,
  ) => {
    const values = resolvedByStar.map(formatter);
    if (values.some(Boolean)) {
      rows.push({ label, values, accentClass });
    }
  };

  pushRow("Degats", "text-orange-200", (resolved) => (resolved.damage ? `${resolved.damage.amount}` : null));
  pushRow("Bouclier", "text-cyan-200", (resolved) => (resolved.shield ? `${resolved.shield.amount}` : null));
  pushRow("Gain mana", "text-sky-200", (resolved) => (resolved.manaGain ? `+${resolved.manaGain.amount}` : null));
  pushRow("Vitesse atk", "text-amber-200", (resolved) =>
    resolved.attackSpeedBuff ? `+${formatPercent(resolved.attackSpeedBuff.amount)}` : null,
  );
  pushRow("Ralent.", "text-blue-200", (resolved) => (resolved.slow ? formatPercent(resolved.slow.amount) : null));
  pushRow("Stun", "text-violet-200", (resolved) => (resolved.stun ? formatDuration(resolved.stun.durationMs) : null));
  pushRow("Poison", "text-emerald-200", (resolved) =>
    resolved.poison ? `${resolved.poison.damagePerTick}` : null,
  );
  pushRow("Invocation", "text-fuchsia-200", (resolved) =>
    resolved.summon ? formatPercent(resolved.summon.factor) : null,
  );

  return rows;
}

export function UnitStatsPanel({
  unit,
  equippedItemIds,
  className,
  isPinned = false,
  onClearPin,
  onHoverChange,
}: UnitStatsPanelProps) {
  const spellAnchorRef = useRef<HTMLButtonElement | null>(null);
  const spellTooltipRef = useRef<HTMLDivElement | null>(null);
  const spellTooltipCloseTimeoutRef = useRef<number | null>(null);
  const [spellTooltipPosition, setSpellTooltipPosition] = useState<SpellTooltipPosition | null>(null);
  const [spellTooltipPinned, setSpellTooltipPinned] = useState(false);

  const traitLine = unit
    ? unit.template.traitLabels.length > 0
      ? `${unit.template.familyLabel} / ${unit.template.traitLabels.join(", ")}`
      : unit.template.familyLabel
    : "";
  const accentColor = unit?.template.ui.accentColor ?? "#60a5fa";
  const abilityTypeLabel = unit ? getAbilityTypeLabel(unit) : "Utilitaire";
  const damageScalingValues = unit ? extractScalingValues(unit.ability.tiers, /degats?/) : [];
  const shieldScalingValues = unit ? extractScalingValues(unit.ability.tiers, /shield|bouclier/) : [];
  const manaScalingValues = unit ? extractScalingValues(unit.ability.tiers, /mana/) : [];
  const abilityScalingRows = unit ? buildAbilityScalingRows(unit) : [];
  const activeTier = unit?.ability.tiers.find((tier) => tier.starLevel === unit.starLevel) ?? null;
  const secondaryEffects =
    activeTier?.lines.filter((line) => !/degats?|shield|bouclier/i.test(line)).join(" • ") || "Aucun effet secondaire";
  const displaySecondaryEffects =
    activeTier?.lines
      .filter((line) => !/degats?|shield|bouclier|mana|vitesse d'attaque|ralentissement|stun|poison|invoque/i.test(line))
      .join(" - ") || "Aucun effet secondaire";
  void secondaryEffects;
  const isSpellTooltipOpen = spellTooltipPosition !== null;

  function cancelSpellTooltipClose() {
    if (spellTooltipCloseTimeoutRef.current !== null) {
      window.clearTimeout(spellTooltipCloseTimeoutRef.current);
      spellTooltipCloseTimeoutRef.current = null;
    }
  }

  function getSpellTooltipPosition(clientX?: number, clientY?: number): SpellTooltipPosition {
    const anchorRect = spellAnchorRef.current?.getBoundingClientRect();
    const tooltipWidth = 272;
    const tooltipHeight = 228;
    const padding = 12;

    const baseX = clientX ?? anchorRect?.right ?? window.innerWidth / 2;
    const baseY = clientY ?? anchorRect?.bottom ?? window.innerHeight / 2;

    return {
      left: clamp(baseX + 16, padding, window.innerWidth - tooltipWidth - padding),
      top: clamp(baseY + 12, padding, window.innerHeight - tooltipHeight - padding),
    };
  }

  function openSpellTooltip(clientX?: number, clientY?: number, pinned = false) {
    cancelSpellTooltipClose();
    setSpellTooltipPosition(getSpellTooltipPosition(clientX, clientY));
    if (pinned) {
      setSpellTooltipPinned(true);
    }
  }

  function scheduleSpellTooltipClose() {
    cancelSpellTooltipClose();
    if (spellTooltipPinned) {
      return;
    }

    spellTooltipCloseTimeoutRef.current = window.setTimeout(() => {
      setSpellTooltipPosition(null);
      spellTooltipCloseTimeoutRef.current = null;
    }, 140);
  }

  function closeSpellTooltip(force = false) {
    cancelSpellTooltipClose();
    if (spellTooltipPinned && !force) {
      return;
    }

    setSpellTooltipPosition(null);
    setSpellTooltipPinned(false);
  }

  useEffect(() => {
    closeSpellTooltip(true);
  }, [unit?.instanceId]);

  useEffect(() => {
    if (!isSpellTooltipOpen) {
      return undefined;
    }

    const handleViewportChange = () => {
      setSpellTooltipPosition(getSpellTooltipPosition());
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isSpellTooltipOpen]);

  useEffect(() => {
    if (!spellTooltipPinned) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }

      if (spellAnchorRef.current?.contains(target) || spellTooltipRef.current?.contains(target)) {
        return;
      }

      closeSpellTooltip(true);
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [spellTooltipPinned]);

  useEffect(() => {
    return () => {
      cancelSpellTooltipClose();
    };
  }, []);

  return (
    <section
      className={clsx("tft-surface-muted relative flex flex-col overflow-visible rounded-[1.25rem] p-2.5", className)}
      data-inspector-panel="true"
      onMouseEnter={onHoverChange ? () => onHoverChange(true) : undefined}
      onMouseLeave={onHoverChange ? () => onHoverChange(false) : undefined}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h2 className="tft-heading font-display text-sm">Unite</h2>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-300">
            {isPinned ? "Fixe" : "Hover"}
          </span>
          {isPinned && onClearPin ? (
            <button
              className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-200 shadow-sm"
              onClick={onClearPin}
              type="button"
            >
              Fermer
            </button>
          ) : null}
        </div>
      </div>

      {unit ? (
        <div className="space-y-1.5">
          <div className="tft-card rounded-[0.95rem] px-2.5 py-2.5">
            <div className="flex items-center gap-2.5">
              <div
                className="grid h-10 w-10 place-items-center rounded-[0.95rem] border border-white/12 text-lg text-white shadow-[0_10px_22px_rgba(0,0,0,0.24)]"
                style={{
                  background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.18) 0%, transparent 30%), linear-gradient(180deg, ${withAlpha(accentColor, 0.96)} 0%, ${withAlpha(accentColor, 0.76)} 100%)`,
                  boxShadow: `0 12px 22px rgba(0,0,0,0.24), 0 0 16px ${withAlpha(accentColor, 0.18)}`,
                }}
              >
                <span className="font-display">{unit.template.ui.iconText}</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-display text-base leading-none text-slate-100">{unit.template.name}</p>
                    <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-slate-400">{traitLine}</p>
                  </div>
                  <span className="rounded-full border border-amber-200/18 bg-amber-300/16 px-1.5 py-0.5 text-[10px] font-display text-amber-100">
                    {"\u2605".repeat(unit.starLevel)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <StatRow
              label="HP"
              bonusLabel={formatBonus(unit.itemBonuses.maxHealth)}
              toneClass="border-orange-300/20 bg-[linear-gradient(180deg,rgba(251,146,60,0.16)_0%,rgba(239,68,68,0.08)_100%)] text-orange-200"
              value={`${unit.currentHealth}/${unit.maxHealth}`}
            />
            <StatRow
              label="Mana"
              bonusLabel={formatBonus(unit.itemBonuses.startingMana)}
              toneClass="border-cyan-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.16)_0%,rgba(59,130,246,0.08)_100%)] text-cyan-200"
              value={`${unit.currentMana}/${unit.maxMana}`}
            />
            <StatRow
              label="ATK"
              bonusLabel={formatBonus(unit.itemBonuses.attackDamage)}
              toneClass="border-amber-300/20 bg-[linear-gradient(180deg,rgba(251,191,36,0.16)_0%,rgba(245,158,11,0.08)_100%)] text-amber-200"
              value={unit.stats.attackDamage}
            />
            <StatRow
              label="AP"
              bonusLabel={formatBonus(unit.itemBonuses.abilityPower)}
              toneClass="border-fuchsia-300/20 bg-[linear-gradient(180deg,rgba(217,70,239,0.16)_0%,rgba(168,85,247,0.08)_100%)] text-fuchsia-200"
              value={unit.stats.abilityPower}
            />
            <StatRow
              label="Armor"
              bonusLabel={formatBonus(unit.itemBonuses.armor)}
              toneClass="border-emerald-300/20 bg-[linear-gradient(180deg,rgba(52,211,153,0.16)_0%,rgba(16,185,129,0.08)_100%)] text-emerald-200"
              value={unit.stats.armor}
            />
            <StatRow
              label="MR"
              bonusLabel={formatBonus(unit.itemBonuses.magicResist)}
              toneClass="border-teal-300/20 bg-[linear-gradient(180deg,rgba(45,212,191,0.16)_0%,rgba(13,148,136,0.08)_100%)] text-teal-200"
              value={unit.stats.magicResist}
            />
            <StatRow
              label="AS"
              bonusLabel={formatBonus(unit.itemBonuses.attackSpeed, 2)}
              toneClass="border-violet-300/20 bg-[linear-gradient(180deg,rgba(167,139,250,0.16)_0%,rgba(139,92,246,0.08)_100%)] text-violet-200"
              value={unit.stats.attackSpeed}
            />
            <StatRow
              label="Range"
              bonusLabel={formatBonus(unit.itemBonuses.range)}
              toneClass="border-slate-300/20 bg-[linear-gradient(180deg,rgba(148,163,184,0.16)_0%,rgba(71,85,105,0.08)_100%)] text-slate-200"
              value={unit.stats.range}
            />
          </div>

          <div className="tft-card rounded-[0.9rem] px-2 py-2">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Items</p>
              <span className="text-[9px] font-semibold text-slate-400">{equippedItemIds.length}</span>
            </div>

            {equippedItemIds.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5">
                {equippedItemIds.map((itemId, index) => {
                  const item = itemById[itemId];
                  if (!item) {
                    return null;
                  }

                  const recipeLabel =
                    item.kind === "complete"
                      ? item.recipe.map((componentId) => itemById[componentId]?.name ?? componentId).join(" + ")
                      : null;
                  const bonusLabel =
                    item.kind === "component"
                      ? item.baseStat
                      : item.statLine || item.bonuses.map((bonus) => bonus.sourceText).join(" + ");

                  return (
                    <div key={`${itemId}-${index}`} className="group relative">
                      <div
                        className={clsx(
                          "grid h-11 place-items-center rounded-[0.8rem] border text-[11px] font-display shadow-sm",
                          item.kind === "complete"
                            ? "border-cyan-300/18 bg-cyan-400/10 text-cyan-100"
                            : "border-orange-300/18 bg-orange-400/10 text-orange-100",
                        )}
                      >
                        {initials(item.name)}
                      </div>

                      <div className="tft-tooltip absolute left-1/2 top-full z-[170] mt-2 hidden w-64 -translate-x-1/2 rounded-[1rem] px-3 py-3 text-left group-hover:block">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-display text-sm text-slate-100">{item.name}</p>
                            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">
                              {item.kind === "complete" ? "Objet final" : "Composant"}
                            </p>
                          </div>
                        </div>

                        <p className="mt-3 text-xs leading-relaxed text-slate-200/88">{bonusLabel}</p>

                        {item.kind === "component" ? (
                          <p className="mt-2 text-[11px] leading-relaxed text-slate-300">{item.notes}</p>
                        ) : (
                          <>
                            <p className="mt-2 text-[11px] leading-relaxed text-slate-300">{item.effectDescription}</p>
                            {recipeLabel ? (
                              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Recette: <span className="normal-case tracking-normal text-slate-200/88">{recipeLabel}</span>
                              </p>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[10px] leading-relaxed text-slate-300">Aucun item equipe.</p>
            )}
          </div>

          <div className="tft-card rounded-[0.9rem] px-2 py-2">
            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Sort</p>

            <button
              ref={spellAnchorRef}
              className="w-full rounded-[0.85rem] border border-cyan-300/14 bg-cyan-400/[0.06] px-2.5 py-2 text-left transition hover:border-cyan-300/24 hover:bg-cyan-400/[0.08]"
              onClick={(event) => {
                event.stopPropagation();
                if (spellTooltipPinned) {
                  closeSpellTooltip(true);
                  return;
                }

                openSpellTooltip(event.clientX, event.clientY, true);
              }}
              onMouseEnter={(event) => {
                openSpellTooltip(event.clientX, event.clientY);
              }}
              onMouseLeave={() => {
                scheduleSpellTooltipClose();
              }}
              onMouseMove={(event) => {
                if (!spellTooltipPinned) {
                  openSpellTooltip(event.clientX, event.clientY);
                }
              }}
              type="button"
            >
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-[0.8rem] border border-cyan-300/16 bg-cyan-400/10 text-sm text-cyan-100">
                  <span className="font-display">{getAbilityIcon(unit)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm text-slate-100">{unit.ability.name}</p>
                </div>
              </div>
            </button>

            {isSpellTooltipOpen && typeof document !== "undefined"
              ? createPortal(
                  <div
                    className="pointer-events-none fixed inset-0"
                    style={{
                      zIndex: 2147483647,
                      isolation: "isolate",
                    }}
                  >
                    <div
                      ref={spellTooltipRef}
                      className="tft-tooltip pointer-events-auto fixed w-64 rounded-[1rem] px-3 py-3 text-left"
                      data-inspector-panel="true"
                      onMouseEnter={() => {
                        cancelSpellTooltipClose();
                        onHoverChange?.(true);
                      }}
                      onMouseLeave={() => {
                        onHoverChange?.(false);
                        scheduleSpellTooltipClose();
                      }}
                      style={{
                        left: spellTooltipPosition.left,
                        top: spellTooltipPosition.top,
                        zIndex: 2147483647,
                      }}
                    >
                    <p className="font-display text-sm text-slate-100">{unit.ability.name}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{unit.ability.description}</p>

                    <div className="mt-3 space-y-1.5 text-[10px] text-slate-200/90">
                      {abilityScalingRows.length > 0
                        ? abilityScalingRows.map((row) => (
                            <ScalingValuesRow
                              key={row.label}
                              accentClass={row.accentClass}
                              activeStarLevel={unit.starLevel}
                              label={row.label}
                              values={row.values}
                            />
                          ))
                        : damageScalingValues.some(Boolean) ? (
                            <ScalingValuesRow
                              accentClass="text-orange-200"
                              activeStarLevel={unit.starLevel}
                              label="Degats"
                              values={damageScalingValues}
                            />
                          )
                        : shieldScalingValues.some(Boolean) ? (
                            <ScalingValuesRow
                              accentClass="text-cyan-200"
                              activeStarLevel={unit.starLevel}
                              label="Shield"
                              values={shieldScalingValues}
                            />
                          )
                        : manaScalingValues.some(Boolean) ? (
                            <ScalingValuesRow
                              accentClass="text-cyan-200"
                              activeStarLevel={unit.starLevel}
                              label="Valeurs"
                              values={manaScalingValues}
                            />
                          )
                        : null}
                      <p>
                        <span className="font-semibold text-cyan-200">Mana :</span> {unit.ability.manaCost}
                      </p>
                        <p>
                          <span className="font-semibold text-violet-200">Type :</span> {abilityTypeLabel}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-100">Effets :</span> {displaySecondaryEffects}
                        </p>
                      </div>
                    </div>
                  </div>,
                  document.body,
                )
              : null}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center">
          <div className="w-full rounded-[1rem] border border-dashed border-white/10 bg-white/[0.04] px-3 py-6 text-sm text-slate-400">
            Survolez une unite sur le board ou sur le bench pour afficher ses statistiques.
          </div>
        </div>
      )}
    </section>
  );
}
