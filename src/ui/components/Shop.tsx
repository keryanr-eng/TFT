import clsx from "clsx";
import { createPreviewRenderUnit, type RenderUnitState } from "../../game/selectors";
import { unitById } from "../../data/unitData";
import type { GamePhase, ShopState } from "../../types/gameTypes";
import { SellZone } from "./SellZone";
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
  onSellUnit: (unitId: string) => void;
  onHoverUnit: (unit: RenderUnitState | null) => void;
  sellPreview: { unitName: string; sellValue: number } | null;
}

function ShopActionButton({
  icon,
  title,
  hint,
  accentClass,
  disabled,
  onClick,
}: {
  icon: string;
  title: string;
  hint: string;
  accentClass: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={clsx(
        "group relative flex min-h-[3.35rem] w-[11rem] items-center gap-3 overflow-hidden rounded-[1.05rem] border px-3 py-2.5 text-left transition duration-150",
        "bg-[linear-gradient(180deg,rgba(33,44,63,0.96)_0%,rgba(18,24,38,0.96)_100%)] shadow-[0_14px_28px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.05)]",
        accentClass,
        disabled
          ? "cursor-not-allowed border-white/10 text-slate-500 opacity-55 shadow-none"
          : "hover:-translate-y-0.5 hover:border-white/24 hover:shadow-[0_18px_34px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.08)] active:translate-y-0",
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-white/10 opacity-70" />
      <div
        className={clsx(
          "grid h-10 w-10 shrink-0 place-items-center rounded-[0.9rem] border text-lg font-display shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
          disabled ? "border-white/8 bg-white/[0.04] text-slate-500" : "border-white/18 bg-white/[0.08] text-white",
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className={clsx("text-[11px] font-bold uppercase tracking-[0.18em]", disabled ? "text-slate-500" : "text-slate-50")}>
          {title}
        </p>
        <p className={clsx("mt-0.5 text-[11px] font-semibold", disabled ? "text-slate-600" : "text-slate-300")}>
          {hint}
        </p>
      </div>
    </button>
  );
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
  onSellUnit,
  onHoverUnit,
  sellPreview,
}: ShopProps) {
  const canInteract = phase === "prep";
  const xpRatio = xpToNext > 0 ? Math.max(0, Math.min(1, currentXp / xpToNext)) : 1;

  return (
    <section className="tft-surface rounded-[1.45rem] p-2.5 xl:p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 xl:flex-nowrap xl:gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
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

        <div className="flex items-start gap-2">
          <SellZone
            canInteract={canInteract}
            isDraggingUnit={Boolean(sellPreview)}
            onSellUnit={onSellUnit}
            sellValue={sellPreview?.sellValue}
            unitName={sellPreview?.unitName}
          />
          <div className="grid gap-2">
            <ShopActionButton
              accentClass="border-orange-300/28"
              disabled={!canInteract || gold < shop.rerollCost}
              hint={`${shop.rerollCost}g`}
              icon="↻"
              onClick={onReroll}
              title="Reroll"
            />
            <ShopActionButton
              accentClass="border-cyan-300/28"
              disabled={!canInteract || gold < shop.xpCost}
              hint={`${shop.xpCost}g`}
              icon="↑"
              onClick={onBuyExperience}
              title="Acheter XP"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1.5 xl:gap-2">
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
