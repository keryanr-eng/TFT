import { synergyById } from "../../data/synergyData";
import { unitData } from "../../data/unitData";
import type { ActiveSynergyState } from "../../types/gameTypes";
import { withAlpha } from "../accent";

interface SynergyPanelProps {
  activeSynergies: ActiveSynergyState[];
}

export function SynergyPanel({ activeSynergies }: SynergyPanelProps) {
  const visibleSynergies = [...activeSynergies].sort((left, right) => {
    const leftTier = left.activeTier ?? 0;
    const rightTier = right.activeTier ?? 0;
    if (leftTier !== rightTier) {
      return rightTier - leftTier;
    }

    return right.count - left.count;
  });

  return (
    <section className="tft-surface relative overflow-visible rounded-[1.45rem] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="tft-heading font-display text-base">Synergies</h2>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/12 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-100">
          {visibleSynergies.length}
        </span>
      </div>

      <div className="space-y-1.5">
        {visibleSynergies.length > 0 ? (
          visibleSynergies.map((synergy) => {
            const template = synergyById[synergy.synergyId];
            const isActive = synergy.activeTier !== null;
            const accentColor = template?.ui.accentColor ?? "#3c84a8";
            const unitNames = unitData
              .filter(
                (unit) => unit.familyId === synergy.synergyId || unit.traitIds.includes(synergy.synergyId),
              )
              .map((unit) => unit.name)
              .sort((left, right) => left.localeCompare(right));

            return (
              <div key={synergy.synergyId} className="group relative">
                <article
                  className={
                    isActive
                      ? "rounded-[0.95rem] border border-cyan-300/24 bg-[linear-gradient(180deg,rgba(34,211,238,0.14)_0%,rgba(34,211,238,0.06)_100%)] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                      : "rounded-[0.95rem] border border-white/8 bg-white/[0.03] px-2.5 py-2 opacity-75 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                  }
                  style={
                    isActive
                      ? {
                          boxShadow: `0 0 20px ${withAlpha(accentColor, 0.18)}, inset 0 1px 0 rgba(255,255,255,0.04)`,
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-[0.8rem] border border-white/12 text-[11px] font-display text-white shadow-[0_8px_16px_rgba(0,0,0,0.2)]"
                      style={{
                        background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.18) 0%, transparent 30%), linear-gradient(180deg, ${withAlpha(accentColor, 0.96)} 0%, ${withAlpha(accentColor, 0.76)} 100%)`,
                        boxShadow: `0 10px 18px rgba(0,0,0,0.22), 0 0 14px ${withAlpha(accentColor, isActive ? 0.28 : 0.12)}`,
                      }}
                    >
                      {template?.ui.iconText ?? "??"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-[14px] leading-none text-slate-100">{synergy.name}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {template?.breakpoints.map((breakpoint) => {
                          const isBreakpointActive = synergy.count >= breakpoint.tier;
                          const isNext = !isBreakpointActive && synergy.nextTier === breakpoint.tier;

                          return (
                            <span
                              key={`${synergy.synergyId}-${breakpoint.tier}`}
                              className={
                                isBreakpointActive
                                  ? "rounded-full border border-cyan-300/32 bg-cyan-400/18 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.14)]"
                                  : isNext
                                    ? "rounded-full border border-amber-300/26 bg-amber-300/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-100"
                                    : "rounded-full border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                              }
                            >
                              {breakpoint.tier}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </article>

                <div className="tft-tooltip pointer-events-none absolute left-full top-0 z-[140] ml-2 hidden w-64 rounded-[1rem] px-3 py-3 text-left group-hover:block">
                  <div className="flex items-center gap-2">
                    <div
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.9rem] border border-white/12 text-[12px] font-display text-white"
                      style={{
                        background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.18) 0%, transparent 30%), linear-gradient(180deg, ${withAlpha(accentColor, 0.96)} 0%, ${withAlpha(accentColor, 0.76)} 100%)`,
                        boxShadow: `0 10px 18px rgba(0,0,0,0.22), 0 0 14px ${withAlpha(accentColor, 0.2)}`,
                      }}
                    >
                      {template?.ui.iconText ?? "??"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-display text-base text-slate-100">{synergy.name}</p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-400">
                        {template?.kind === "family" ? "Famille" : "Trait"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-slate-200/88">
                    {template?.gameplayIdentity || synergy.description || "Bonus de combat actif."}
                  </p>

                  <div className="mt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Paliers</p>
                    <div className="mt-2 space-y-1.5">
                      {template?.breakpoints.map((breakpoint) => {
                        const isBreakpointActive = synergy.count >= breakpoint.tier;

                        return (
                          <div
                            key={`${synergy.synergyId}-${breakpoint.tier}`}
                            className={
                              isBreakpointActive
                                ? "rounded-[0.8rem] border border-cyan-300/24 bg-cyan-400/10 px-2.5 py-2 text-[11px] text-cyan-100"
                                : "rounded-[0.8rem] border border-white/8 bg-white/[0.04] px-2.5 py-2 text-[11px] text-slate-300"
                            }
                          >
                            <p className="font-semibold uppercase tracking-[0.12em]">
                              {isBreakpointActive ? "[ACTIF]" : "[INACTIF]"} <span className="font-display">({breakpoint.tier})</span>
                            </p>
                            <p className="mt-1 leading-relaxed">
                              {breakpoint.description || "Effet a detailler."}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Unites</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-200/88">
                      {unitNames.length > 0 ? unitNames.join(", ") : "Aucune unite referencee."}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[0.95rem] border border-dashed border-white/10 bg-white/[0.04] px-3 py-3 text-[11px] text-slate-400">
            Aucune synergie visible.
          </div>
        )}
      </div>
    </section>
  );
}
