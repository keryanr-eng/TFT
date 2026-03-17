import clsx from "clsx";
import type { RenderUnitState } from "../../game/selectors";
import { withAlpha } from "../accent";
import { clearDraggedUnitId, getDraggedItemId, setDraggedUnitId } from "../dragData";

interface BenchUnitProps {
  unit: RenderUnitState;
  draggable?: boolean;
  highlighted?: boolean;
  itemIds?: string[];
  itemDropState?: "idle" | "eligible" | "active";
  className?: string;
  onHoverChange?: (isHovered: boolean) => void;
  onClick?: () => void;
  onSell?: () => void;
  onUnitDragStateChange?: (unitId: string | null) => void;
  onItemDrop?: (itemId: string) => void;
  onItemDragStateChange?: (isActive: boolean) => void;
}

function renderStars(starLevel: number) {
  return Array.from({ length: starLevel }, (_, index) => (
    <span key={`${starLevel}-${index}`}>{"\u2605"}</span>
  ));
}

export function BenchUnit({
  unit,
  draggable = false,
  highlighted = false,
  itemIds = [],
  itemDropState = "idle",
  className,
  onHoverChange,
  onClick,
  onSell,
  onUnitDragStateChange,
  onItemDrop,
  onItemDragStateChange,
}: BenchUnitProps) {
  const healthRatio = Math.max(0, Math.min(1, unit.currentHealth / unit.maxHealth));
  const manaRatio = Math.max(0, Math.min(1, unit.currentMana / unit.maxMana));
  const isItemEligible = itemDropState === "eligible" || itemDropState === "active";
  const accentGlow = withAlpha(unit.template.ui.accentColor, highlighted ? 0.26 : 0.16);
  const iconGlow = withAlpha(unit.template.ui.accentColor, 0.22);

  return (
    <article
      data-inspector-anchor="true"
      className={clsx(
        "relative grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto_auto] rounded-[1rem] border border-white/12 bg-[linear-gradient(180deg,rgba(20,30,48,0.96)_0%,rgba(10,16,28,0.98)_100%)] px-2.5 py-2.5 text-slate-100 transition duration-150",
        highlighted && "scale-[1.02] border-amber-300/55 ring-2 ring-amber-300/24",
        isItemEligible && "border-cyan-300/35 ring-2 ring-cyan-300/12",
        itemDropState === "active" && "border-cyan-300/70 ring-2 ring-cyan-300/30 bg-[linear-gradient(180deg,rgba(14,44,62,0.96)_0%,rgba(8,18,28,0.96)_100%)]",
        !unit.isAlive && "opacity-45 saturate-50",
        draggable && "cursor-grab active:cursor-grabbing",
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:border-white/24",
        className,
      )}
      draggable={draggable}
      onClick={onClick}
      onContextMenu={
        onSell
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
              onSell();
            }
          : undefined
      }
      onDragEnd={
        draggable
          ? () => {
              clearDraggedUnitId();
              onUnitDragStateChange?.(null);
            }
          : undefined
      }
      onDragEnter={
        onItemDragStateChange
          ? (event) => {
              if (!getDraggedItemId(event)) {
                return;
              }

              event.preventDefault();
              event.stopPropagation();
              onItemDragStateChange(true);
            }
          : undefined
      }
      onDragLeave={
        onItemDragStateChange
          ? (event) => {
              if (!getDraggedItemId(event)) {
                return;
              }

              event.preventDefault();
              event.stopPropagation();
              onItemDragStateChange(false);
            }
          : undefined
      }
      onDragOver={
        onItemDrop
          ? (event) => {
              if (!getDraggedItemId(event)) {
                return;
              }

              event.preventDefault();
              event.stopPropagation();
              event.dataTransfer.dropEffect = "copy";
            }
          : undefined
      }
      onDrop={
        onItemDrop
          ? (event) => {
              const itemId = getDraggedItemId(event);
              if (!itemId) {
                return;
              }

              event.preventDefault();
              event.stopPropagation();
              onItemDragStateChange?.(false);
              onItemDrop(itemId);
            }
          : undefined
      }
      onDragStart={
        draggable
          ? (event) => {
              setDraggedUnitId(event, unit.instanceId);
              onUnitDragStateChange?.(unit.instanceId);
            }
          : undefined
      }
      onMouseEnter={onHoverChange ? () => onHoverChange(true) : undefined}
      onMouseLeave={onHoverChange ? () => onHoverChange(false) : undefined}
      style={{
        boxShadow: `0 14px 24px rgba(0,0,0,0.26), 0 0 16px ${accentGlow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full border border-amber-300/24 bg-[linear-gradient(180deg,rgba(255,224,133,0.22)_0%,rgba(247,201,72,0.1)_100%)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-100">
          {unit.template.cost}g
        </span>
        <span className="rounded-full border border-amber-200/20 bg-[linear-gradient(180deg,rgba(255,224,133,0.96)_0%,rgba(247,201,72,0.9)_100%)] px-2 py-0.5 text-[12px] font-display leading-none text-slate-950 shadow-[0_8px_16px_rgba(0,0,0,0.22)]">
          {renderStars(unit.starLevel)}
        </span>
      </div>

      <div className="relative grid min-h-0 place-items-center py-1.5">
        <div
          className="relative grid h-14 w-14 place-items-center rounded-[1.1rem] border border-white/14 text-[28px] leading-none text-white"
          style={{
            background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.18) 0%, transparent 30%), linear-gradient(180deg, ${withAlpha(unit.template.ui.accentColor, 0.94)} 0%, ${withAlpha(unit.template.ui.accentColor, 0.74)} 100%)`,
            boxShadow: `0 12px 22px rgba(0,0,0,0.24), 0 0 14px ${iconGlow}, inset 0 1px 0 rgba(255,255,255,0.16)`,
          }}
        >
          <span className="font-display drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]">{unit.template.ui.iconText}</span>
        </div>
      </div>

      <p className="truncate text-center font-display text-[13px] leading-none text-slate-100">
        {unit.template.name}
      </p>

      {itemIds.length > 0 ? (
        <div className="mt-1 flex items-center justify-center gap-1">
          {itemIds.slice(0, 3).map((itemId, index) => (
            <span
              key={`${itemId}-${index}`}
              className="h-2.5 w-2.5 rounded-full border border-white/70 bg-cyan-300/90 shadow-[0_0_10px_rgba(103,232,249,0.3)]"
            />
          ))}
        </div>
      ) : null}

      <div className="mt-1.5 space-y-1">
        <div className="h-2.5 overflow-hidden rounded-full border border-orange-200/10 bg-[#2b1116] shadow-[0_1px_0_rgba(255,255,255,0.03)]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#ffb26f_0%,#ff6a4f_48%,#ff4b45_100%)] shadow-[0_0_10px_rgba(255,106,79,0.3)] transition-[width] duration-150"
            style={{ width: `${healthRatio * 100}%` }}
          />
        </div>
        <div className="h-2 overflow-hidden rounded-full border border-cyan-200/10 bg-[#101f3f] shadow-[0_1px_0_rgba(255,255,255,0.03)]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#86c4ff_0%,#4aa5ff_45%,#3b82f6_100%)] shadow-[0_0_10px_rgba(59,130,246,0.28)] transition-[width] duration-150"
            style={{ width: `${manaRatio * 100}%` }}
          />
        </div>
      </div>
    </article>
  );
}
