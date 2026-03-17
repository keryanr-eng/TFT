import clsx from "clsx";
import type { RenderUnitState } from "../../game/selectors";
import { withAlpha } from "../accent";
import { clearDraggedUnitId, getDraggedItemId, setDraggedUnitId } from "../dragData";

interface BoardUnitProps {
  unit: RenderUnitState;
  draggable?: boolean;
  highlighted?: boolean;
  itemIds?: string[];
  itemDropState?: "idle" | "eligible" | "active";
  className?: string;
  onHoverChange?: (isHovered: boolean) => void;
  onClick?: () => void;
  onPin?: () => void;
  onUnitDragStateChange?: (unitId: string | null) => void;
  onItemDrop?: (itemId: string) => void;
  onItemDragStateChange?: (isActive: boolean) => void;
}

function renderStars(starLevel: number) {
  return Array.from({ length: starLevel }, (_, index) => (
    <span key={`${starLevel}-${index}`}>{"\u2605"}</span>
  ));
}

export function BoardUnit({
  unit,
  draggable = false,
  highlighted = false,
  itemIds = [],
  itemDropState = "idle",
  className,
  onHoverChange,
  onClick,
  onPin,
  onUnitDragStateChange,
  onItemDrop,
  onItemDragStateChange,
}: BoardUnitProps) {
  const healthRatio = Math.max(0, Math.min(1, unit.currentHealth / unit.maxHealth));
  const manaRatio = Math.max(0, Math.min(1, unit.currentMana / unit.maxMana));
  const isItemEligible = itemDropState === "eligible" || itemDropState === "active";
  const accentGlow = withAlpha(unit.template.ui.accentColor, highlighted ? 0.34 : 0.24);
  const accentGlowSoft = withAlpha(unit.template.ui.accentColor, 0.18);
  const hoverGlow = withAlpha(unit.template.ui.accentColor, 0.28);

  return (
    <article
      data-inspector-anchor="true"
      className={clsx(
        "relative grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] rounded-[1rem] border border-white/14 bg-[linear-gradient(180deg,rgba(22,33,53,0.98)_0%,rgba(10,16,28,0.98)_100%)] px-2 py-1.75 text-slate-100 transition duration-150",
        highlighted && "scale-[1.03] border-amber-300/60 ring-2 ring-amber-300/30",
        isItemEligible && "border-cyan-300/35 ring-2 ring-cyan-300/10",
        itemDropState === "active" && "border-cyan-300/70 ring-2 ring-cyan-300/35 bg-[linear-gradient(180deg,rgba(14,44,62,0.96)_0%,rgba(8,18,28,0.96)_100%)]",
        !unit.isAlive && "opacity-45 saturate-50",
        draggable && "cursor-grab active:cursor-grabbing",
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:scale-[1.02] hover:border-white/28",
        className,
      )}
      draggable={draggable}
      onClick={onClick}
      onContextMenu={
        onPin
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
              onPin();
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
        boxShadow: `0 16px 28px rgba(0,0,0,0.32), 0 0 22px ${highlighted ? accentGlow : accentGlowSoft}, inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      <div className="h-3 overflow-hidden rounded-full border border-orange-200/10 bg-[#2b1116] shadow-[0_1px_0_rgba(255,255,255,0.03)]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#ffb26f_0%,#ff6a4f_48%,#ff4b45_100%)] shadow-[0_0_10px_rgba(255,106,79,0.32)] transition-[width] duration-150"
          style={{ width: `${healthRatio * 100}%` }}
        />
      </div>

      <div className="relative grid min-h-0 place-items-center py-1.25">
        <div
          className="relative grid h-12 w-12 place-items-center rounded-[1rem] border border-white/16 text-[24px] leading-none text-white"
          style={{
            background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.18) 0%, transparent 30%), linear-gradient(180deg, ${withAlpha(unit.template.ui.accentColor, 0.96)} 0%, ${withAlpha(unit.template.ui.accentColor, 0.74)} 100%)`,
            boxShadow: `0 10px 18px rgba(0,0,0,0.26), 0 0 14px ${hoverGlow}, inset 0 1px 0 rgba(255,255,255,0.18)`,
          }}
        >
          <span className="font-display drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]">{unit.template.ui.iconText}</span>
        </div>
        <div className="absolute right-0 top-0 rounded-full border border-amber-200/22 bg-[linear-gradient(180deg,rgba(255,224,133,0.96)_0%,rgba(247,201,72,0.9)_100%)] px-1.5 py-0.5 text-[10px] font-display leading-none text-slate-950 shadow-[0_8px_16px_rgba(0,0,0,0.22)]">
          {renderStars(unit.starLevel)}
        </div>
        {itemIds.length > 0 ? (
          <div className="absolute bottom-1 right-0 flex items-center gap-1">
            {itemIds.slice(0, 3).map((itemId, index) => (
              <span
              key={`${itemId}-${index}`}
              className="h-2 w-2 rounded-full border border-white/70 bg-cyan-300/90 shadow-[0_0_8px_rgba(103,232,249,0.26)]"
            />
          ))}
        </div>
      ) : null}
      </div>

      <div className="h-2.5 overflow-hidden rounded-full border border-cyan-200/10 bg-[#0f1d3d] shadow-[0_1px_0_rgba(255,255,255,0.03)]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#86c4ff_0%,#4aa5ff_45%,#3b82f6_100%)] shadow-[0_0_10px_rgba(59,130,246,0.28)] transition-[width] duration-150"
          style={{ width: `${manaRatio * 100}%` }}
        />
      </div>
    </article>
  );
}
