import clsx from "clsx";
import { createPreviewRenderUnit, type RenderUnitState } from "../../game/selectors";
import { unitById } from "../../data/unitData";
import type { GamePhase, ShopState } from "../../types/gameTypes";
import { ShopUnit } from "./ShopUnit";

interface ShopProps {
  shop: ShopState;
  gold: number;
  level: number;
  currentXp: number;
  xpToNext: number;
  goldDelta: number | null;
  phase: GamePhase;
  onBuyUnit: (slotIndex: number) => void;
  onReroll: () => void;
  onBuyExperience: () => void;
  onHoverUnit: (unit: RenderUnitState | null) => void;
}

export function Shop({
  shop,
  gold,
  level,
  currentXp,
  xpToNext,
  goldDelta,
  phase,
  onBuyUnit,
  onReroll,
  onBuyExperience,
  onHoverUnit,
}: ShopProps) {
  const canInteract = phase === "prep";
  const xpRatio = xpToNext > 0 ? Math.max(0, Math.min(1, currentXp / xpToNext)) : 1;

  return (
    <section className="tft-surface rounded-[1.45rem] p-3">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={clsx(
              "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition shadow-[0_0_20px_rgba(247,201,72,0.08)]",
              goldDelta === null
                ? "border-amber-300/32 bg-[linear-gradient(180deg,rgba(255,224,133,0.28)_0%,rgba(247,201,72,0.14)_100%)] text-amber-50"
                : goldDelta < 0
                  ? "border-orange-300/32 bg-[linear-gradient(180deg,rgba(255,132,92,0.3)_0%,rgba(255,132,92,0.14)_100%)] text-orange-50"
                  : "border-emerald-300/28 bg-[linear-gradient(180deg,rgba(110,231,183,0.24)_0%,rgba(110,231,183,0.12)_100%)] text-emerald-50",
            )}
          >
            Or {gold}
            {goldDelta !== null ? ` ${goldDelta > 0 ? `+${goldDelta}` : goldDelta}` : ""}
          </div>
          <div className="rounded-full border border-cyan-300/22 bg-[linear-gradient(180deg,rgba(34,211,238,0.18)_0%,rgba(34,211,238,0.08)_100%)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.08)]">
            Niv {level}
          </div>
          <div className="min-w-[8rem] rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.03)_100%)] px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              <span>XP</span>
              <span>
                {currentXp}/{xpToNext}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#7dd3fc_0%,#38bdf8_40%,#3b82f6_100%)] shadow-[0_0_12px_rgba(56,189,248,0.35)]" style={{ width: `${xpRatio * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded-full border border-orange-300/24 bg-[linear-gradient(180deg,rgba(255,132,92,0.94)_0%,rgba(235,95,70,0.9)_100%)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-50 transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(255,132,92,0.22)] disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!canInteract || gold < shop.rerollCost}
            onClick={onReroll}
            type="button"
          >
            Reroll {shop.rerollCost}g
          </button>
          <button
            className="rounded-full border border-cyan-300/24 bg-[linear-gradient(180deg,rgba(60,132,168,0.96)_0%,rgba(42,96,134,0.92)_100%)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-50 transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(60,132,168,0.24)] disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!canInteract || gold < shop.xpCost}
            onClick={onBuyExperience}
            type="button"
          >
            Acheter XP
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {shop.offers.map((offer) => {
          const template = unitById[offer.unitId];
          if (!template) {
            return null;
          }

          const canBuy = canInteract && gold >= offer.cost;
          const previewUnit = createPreviewRenderUnit(template);

          return (
            <ShopUnit
              key={`shop-${offer.slotIndex}`}
              cost={offer.cost}
              disabled={!canBuy}
              onHoverChange={(isHovered) => onHoverUnit(isHovered ? previewUnit : null)}
              onBuy={() => onBuyUnit(offer.slotIndex)}
              template={template}
            />
          );
        })}
      </div>
    </section>
  );
}
