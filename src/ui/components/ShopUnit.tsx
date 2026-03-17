import clsx from "clsx";
import type { UnitTemplate } from "../../types/gameTypes";
import { withAlpha } from "../accent";

interface ShopUnitProps {
  template: UnitTemplate;
  cost: number;
  disabled?: boolean;
  onBuy: () => void;
  onPin?: () => void;
  onHoverChange?: (isHovered: boolean) => void;
}

export function ShopUnit({ template, cost, disabled = false, onBuy, onPin, onHoverChange }: ShopUnitProps) {
  const accentGlow = withAlpha(template.ui.accentColor, 0.14);
  const primaryTraits = template.traitLabels.slice(0, 2);

  return (
    <button
      aria-disabled={disabled}
      data-inspector-anchor="true"
      className={clsx(
        "tft-shop-card group flex h-full min-h-0 flex-col justify-center rounded-[0.85rem] px-1.5 py-1 text-left transition duration-150",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:-translate-y-0.5 hover:border-cyan-300/30 hover:shadow-[0_16px_28px_rgba(0,0,0,0.28),0_0_18px_rgba(56,189,248,0.08)] active:translate-y-0",
      )}
      style={
        disabled
          ? undefined
          : {
              boxShadow: `0 10px 20px rgba(0,0,0,0.2), 0 0 12px ${accentGlow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
            }
      }
      onMouseEnter={onHoverChange ? () => onHoverChange(true) : undefined}
      onMouseLeave={onHoverChange ? () => onHoverChange(false) : undefined}
      onContextMenu={
        onPin
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
              onPin();
            }
          : undefined
      }
      onClick={() => {
        if (disabled) {
          return;
        }

        onBuy();
      }}
      type="button"
    >
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <div
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[0.7rem] border border-white/14 text-[17px] text-white"
            style={{
              background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.2) 0%, transparent 30%), linear-gradient(180deg, ${withAlpha(template.ui.accentColor, 0.96)} 0%, ${withAlpha(template.ui.accentColor, 0.76)} 100%)`,
              boxShadow: `0 8px 14px rgba(0,0,0,0.22), 0 0 10px ${accentGlow}, inset 0 1px 0 rgba(255,255,255,0.16)`,
            }}
          >
            <span className="font-display drop-shadow-[0_2px_3px_rgba(0,0,0,0.28)]">{template.ui.iconText}</span>
          </div>

          <div className="min-w-0">
            <p className="truncate font-display text-[13px] leading-none text-slate-100">{template.name}</p>
            <div className="mt-0.5 flex min-w-0 items-center gap-1">
              <span className="truncate text-[8px] uppercase tracking-[0.12em] text-slate-400">
                {template.familyLabel}
              </span>
              {primaryTraits.length > 0 ? <span className="h-3 w-px shrink-0 bg-white/10" /> : null}
              <div className="flex min-w-0 flex-wrap gap-0.5">
                {primaryTraits.map((label) => (
                  <span
                    key={`${template.id}-${label}`}
                    className="rounded-full border border-white/8 bg-white/[0.04] px-1.25 py-0.5 text-[7px] font-semibold uppercase tracking-[0.08em] text-slate-300"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <span className="shrink-0 rounded-full border border-amber-300/24 bg-[linear-gradient(180deg,rgba(255,224,133,0.22)_0%,rgba(247,201,72,0.1)_100%)] px-1.25 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-amber-100">
          {cost}g
        </span>
      </div>
    </button>
  );
}
