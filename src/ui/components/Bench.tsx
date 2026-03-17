import { useState } from "react";
import type { RenderBenchSlot } from "../../game/selectors";
import type { GamePhase } from "../../types/gameTypes";
import { getDraggedItemId, getDraggedUnitId } from "../dragData";
import { BenchUnit } from "./BenchUnit";

interface BenchProps {
  slots: RenderBenchSlot[];
  phase: GamePhase;
  highlightedUnitIds: string[];
  selectedItemId: string | null;
  onDropUnit: (unitId: string, slotIndex: number) => void;
  onDropItemToUnit: (itemId: string, unitId: string) => void;
  onHoverUnit: (unitId: string | null) => void;
  onPinUnit: (unitId: string) => void;
  onUnitDragStateChange: (unitId: string | null) => void;
}

export function Bench({
  slots,
  phase,
  highlightedUnitIds,
  selectedItemId,
  onDropUnit,
  onDropItemToUnit,
  onHoverUnit,
  onPinUnit,
  onUnitDragStateChange,
}: BenchProps) {
  const canDrop = phase === "prep";
  const filledSlots = slots.filter((slot) => slot.unit !== null).length;
  const highlightedUnits = new Set(highlightedUnitIds);
  const [activeItemTargetUnitId, setActiveItemTargetUnitId] = useState<string | null>(null);

  return (
    <section className="tft-surface-muted h-full overflow-hidden rounded-[1.1rem] p-1.25 xl:p-1.5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="tft-heading font-display text-[12px]">Bench</h2>
        <span className="rounded-full border border-amber-300/20 bg-amber-300/14 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-amber-100">
          {filledSlots}/{slots.length}
        </span>
      </div>

      <div className="grid grid-cols-9 gap-0.75 xl:gap-1">
        {slots.map((slot) => {
          const unit = slot.unit;
          const equippedCount = unit ? unit.itemIds.length : 0;
          const canReceiveItem = Boolean(unit && canDrop && equippedCount < 3);

          return (
            <div
              key={`bench-slot-${slot.slotIndex}`}
              className="tft-empty-slot h-[4.05rem] rounded-[0.8rem] p-0.5 transition hover:border-cyan-300/18 hover:bg-white/[0.06] xl:h-[4.45rem]"
              onDragOver={
                canDrop
                  ? (event) => {
                      event.preventDefault();
                    }
                  : undefined
              }
              onDrop={
                canDrop
                  ? (event) => {
                      event.preventDefault();
                      const itemId = getDraggedItemId(event);
                      if (itemId && unit) {
                        onDropItemToUnit(itemId, unit.instanceId);
                        return;
                      }

                      const unitId = getDraggedUnitId(event);
                      if (unitId) {
                        onDropUnit(unitId, slot.slotIndex);
                      }
                    }
                  : undefined
              }
            >
              {unit ? (
                <BenchUnit
                  className="h-full"
                  draggable={canDrop}
                  highlighted={highlightedUnits.has(unit.instanceId)}
                  itemIds={unit.itemIds}
                  itemDropState={
                    canReceiveItem
                      ? activeItemTargetUnitId === unit.instanceId
                        ? "active"
                        : selectedItemId
                          ? "eligible"
                          : "idle"
                      : "idle"
                  }
                  onClick={
                    selectedItemId && canReceiveItem
                      ? () => {
                          onDropItemToUnit(selectedItemId, unit.instanceId);
                        }
                      : undefined
                  }
                  onHoverChange={(isHovered) => onHoverUnit(isHovered ? unit.instanceId : null)}
                  onItemDragStateChange={
                    canReceiveItem
                      ? (isActive) => {
                          setActiveItemTargetUnitId(isActive ? unit.instanceId : null);
                        }
                      : undefined
                  }
                  onItemDrop={
                    canReceiveItem
                      ? (itemId) => {
                          onDropItemToUnit(itemId, unit.instanceId);
                        }
                      : undefined
                  }
                  onPin={() => {
                    onPinUnit(unit.instanceId);
                  }}
                  onUnitDragStateChange={onUnitDragStateChange}
                  unit={unit}
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-[0.7rem] bg-white/[0.03] text-[7px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {slot.slotIndex + 1}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
