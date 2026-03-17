import clsx from "clsx";
import type { UnitTemplate } from "../../types/gameTypes";
import { withAlpha } from "../accent";

interface ShopUnitProps {
  template: UnitTemplate;
  cost: number;
  disabled?: boolean;
  onBuy: () => void;
  onHoverChange?: (isHovered: boolean) => void;
}

export function ShopUnit({ template, cost, disabled = false, onBuy, onHoverChange }: ShopUnitProps) {
  const accentGlow = withAlpha(template.ui.accentColor, 0.18);

  return (
    <button
      aria-disabled={disabled}
      data-inspector-anchor="true"
      className={clsx(
        "group flex min-h-[8.2rem] flex-col rounded-[1.2rem] border p-2.5 text-left transition",
        disabled
          ? "cursor-not-allowed border-white/8 bg-white/[0.05] opacity-50"
          : "border-white/12 bg-[linear-gradient(180deg,rgba(24,35,54,0.98)_0%,rgba(11,17,29,0.98)_100%)] hover:-translate-y-1 hover:scale-[1.01] hover:border-cyan-300/35 hover:shadow-[0_18px_34px_rgba(0,0,0,0.28)] active:translate-y-0",
      )}
      style={
        disabled
          ? undefined
          : {
              boxShadow: `0 16px 30px rgba(0,0,0,0.24), 0 0 16px ${accentGlow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
            }
      }
      onMouseEnter={onHoverChange ? () => onHoverChange(true) : undefined}
      onMouseLeave={onHoverChange ? () => onHoverChange(false) : undefined}
      onClick={() => {
        if (disabled) {
          return;
        }

        onBuy();
      }}
      type="button"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="relative">
          <div
            className="relative grid h-12 w-12 place-items-center rounded-[1rem] border border-white/14 text-[24px] text-white"
            style={{
              background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.2) 0%, transparent 30%), linear-gradient(180deg, ${withAlpha(template.ui.accentColor, 0.96)} 0%, ${withAlpha(template.ui.accentColor, 0.76)} 100%)`,
              boxShadow: `0 12px 22px rgba(0,0,0,0.24), 0 0 14px ${accentGlow}, inset 0 1px 0 rgba(255,255,255,0.16)`,
            }}
          >
            <span className="font-display drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]">{template.ui.iconText}</span>
          </div>
        </div>
        <span className="rounded-full border border-amber-300/28 bg-[linear-gradient(180deg,rgba(255,224,133,0.24)_0%,rgba(247,201,72,0.12)_100%)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-100 shadow-[0_0_18px_rgba(247,201,72,0.08)]">
          {cost}g
        </span>
      </div>

      <div className="mt-2 min-w-0">
        <p className="truncate font-display text-[18px] leading-none text-slate-100">{template.name}</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">
          {template.familyLabel} / {template.roleLabel}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {template.traitLabels.slice(0, 2).map((label) => (
          <span
            key={`${template.id}-${label}`}
            className="rounded-full border border-white/8 bg-white/[0.05] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-300"
          >
            {label}
          </span>
        ))}
      </div>
    </button>
  );
}
