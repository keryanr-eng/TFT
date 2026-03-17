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
  onStartCombat: () => void;
  onAdvanceRound: () => void;
  onReset: () => void;
  onBuyUnit: (slotIndex: number) => void;
  onReroll: () => void;
  onBuyExperience: () => void;
  onSellUnit: (unitId: string) => void;
  onHoverUnit: (unit: RenderUnitState | null) => void;
  onPinUnit: (unit: RenderUnitState) => void;
  sellPreview: { unitName: string; sellValue: number } | null;
}

function ShopInlineActionButton({
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
        "group relative flex h-9 shrink-0 items-center gap-2 overflow-hidden rounded-[0.9rem] border px-2.5 text-left transition duration-150",
        "bg-[linear-gradient(180deg,rgba(33,44,63,0.96)_0%,rgba(18,24,38,0.96)_100%)] shadow-[0_10px_22px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.05)]",
        accentClass,
        disabled
          ? "cursor-not-allowed border-white/10 text-slate-500 opacity-55 shadow-none"
          : "hover:-translate-y-0.5 hover:border-white/24 hover:shadow-[0_14px_28px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.08)] active:translate-y-0",
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <div
        className={clsx(
          "grid h-7 w-7 shrink-0 place-items-center rounded-[0.7rem] border text-sm font-display shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
          disabled ? "border-white/8 bg-white/[0.04] text-slate-500" : "border-white/18 bg-white/[0.08] text-white",
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className={clsx("text-[9px] font-bold uppercase tracking-[0.14em]", disabled ? "text-slate-500" : "text-slate-50")}>
          {title}
        </p>
        <p className={clsx("mt-0.25 text-[9px] font-semibold", disabled ? "text-slate-600" : "text-slate-300")}>
          {hint}
        </p>
      </div>
    </button>
  );
}

function ShopHeaderButton({
  label,
  disabled,
  tone,
  onClick,
}: {
  label: string;
  disabled: boolean;
  tone: "primary" | "secondary" | "warning";
  onClick: () => void;
}) {
  const toneClass =
    tone === "primary"
      ? "border-cyan-200/46 bg-[linear-gradient(180deg,rgba(84,188,255,0.98)_0%,rgba(27,115,196,0.96)_100%)] text-white shadow-[0_12px_24px_rgba(36,133,226,0.24),inset_0_1px_0_rgba(255,255,255,0.18)] hover:border-cyan-100/70"
      : tone === "warning"
        ? "border-amber-200/36 bg-[linear-gradient(180deg,rgba(251,218,102,0.96)_0%,rgba(214,166,44,0.92)_100%)] text-slate-950 shadow-[0_12px_22px_rgba(214,166,44,0.16),inset_0_1px_0_rgba(255,255,255,0.18)] hover:border-amber-100/55"
        : "border-white/12 bg-[linear-gradient(180deg,rgba(47,59,81,0.9)_0%,rgba(26,34,48,0.88)_100%)] text-slate-200 shadow-[0_10px_18px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-white/24";

  return (
    <button
      className={clsx(
        "rounded-full border px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.18em] transition",
        disabled
          ? "cursor-not-allowed border-white/10 bg-[linear-gradient(180deg,rgba(46,59,79,0.74)_0%,rgba(23,31,45,0.7)_100%)] text-slate-500 shadow-none"
          : clsx(toneClass, "hover:-translate-y-0.5 active:translate-y-0"),
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
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
  onStartCombat,
  onAdvanceRound,
  onReset,
  onBuyUnit,
  onReroll,
  onBuyExperience,
  onSellUnit,
  onHoverUnit,
  onPinUnit,
  sellPreview,
}: ShopProps) {
  const canInteract = phase === "prep";
  const xpRatio = xpToNext > 0 ? Math.max(0, Math.min(1, currentXp / xpToNext)) : 1;

  return (
    <section className="tft-shop-band relative flex h-full min-h-0 flex-col overflow-visible rounded-[1.15rem] p-1.25 xl:p-1.5">
      {sellPreview ? (
        <div className="absolute right-1.5 top-1.5 z-30">
          <SellZone
            canInteract={canInteract}
            isDraggingUnit={Boolean(sellPreview)}
            onSellUnit={onSellUnit}
            sellValue={sellPreview.sellValue}
            unitName={sellPreview.unitName}
          />
        </div>
      ) : null}

      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.25">
          <div className="flex min-w-0 items-center gap-1">
            <div
              className={clsx(
                "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition shadow-[0_0_16px_rgba(247,201,72,0.08)]",
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
            <div className="rounded-full border border-cyan-300/22 bg-[linear-gradient(180deg,rgba(34,211,238,0.18)_0%,rgba(34,211,238,0.08)_100%)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.08)]">
              Niv {level}
            </div>
            <div className="min-w-[6.5rem] rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.03)_100%)] px-2.5 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center justify-between gap-2 text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                <span>XP</span>
                <span>
                  {currentXp}/{xpToNext}
                </span>
              </div>
              <div className="mt-1 h-[5px] overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#7dd3fc_0%,#38bdf8_40%,#3b82f6_100%)] shadow-[0_0_12px_rgba(56,189,248,0.35)]"
                  style={{ width: `${xpRatio * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-1">
            <ShopInlineActionButton
              accentClass="border-orange-300/28"
              disabled={!canInteract || gold < shop.rerollCost}
              hint={`${shop.rerollCost}g`}
              icon={"\u21BB"}
              onClick={onReroll}
              title="Reroll"
            />
            <ShopInlineActionButton
              accentClass="border-cyan-300/28"
              disabled={!canInteract || gold < shop.xpCost}
              hint={`${shop.xpCost}g`}
              icon={"\u2191"}
              onClick={onBuyExperience}
              title="XP"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <ShopHeaderButton disabled={phase !== "prep"} label="Lancer le combat" onClick={onStartCombat} tone="primary" />
          <ShopHeaderButton disabled={phase !== "resolution"} label="Round suivant" onClick={onAdvanceRound} tone="secondary" />
          <ShopHeaderButton disabled={false} label="Nouvelle partie" onClick={onReset} tone="warning" />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-5 gap-1 xl:gap-1.1">
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
              onPin={() => onPinUnit(previewUnit)}
              onBuy={() => onBuyUnit(offer.slotIndex)}
              template={template}
            />
          );
        })}
      </div>
    </section>
  );
}
