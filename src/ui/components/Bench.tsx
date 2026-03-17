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
  onSelectUnit: (unitId: string) => void;
}

export function Bench({
  slots,
  phase,
  highlightedUnitIds,
  selectedItemId,
  onDropUnit,
  onDropItemToUnit,
  onHoverUnit,
  onSelectUnit,
}: BenchProps) {
  const canDrop = phase === "prep";
  const filledSlots = slots.filter((slot) => slot.unit !== null).length;
  const highlightedUnits = new Set(highlightedUnitIds);
  const [activeItemTargetUnitId, setActiveItemTargetUnitId] = useState<string | null>(null);

  return (
    <section className="tft-surface rounded-[1.5rem] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="tft-heading font-display text-lg">Bench</h2>
        <span className="rounded-full border border-amber-300/20 bg-amber-300/14 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100">
          {filledSlots}/{slots.length}
        </span>
      </div>

      <div className="grid grid-cols-9 gap-2">
        {slots.map((slot) => {
          const unit = slot.unit;
          const equippedCount = unit ? unit.itemIds.length : 0;
          const canReceiveItem = Boolean(unit && canDrop && equippedCount < 3);

          return (
            <div
              key={`bench-slot-${slot.slotIndex}`}
              className="tft-empty-slot h-32 rounded-[1.1rem] p-1.5 transition hover:border-cyan-300/18 hover:bg-white/[0.06]"
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
                    () => {
                      if (selectedItemId && canReceiveItem) {
                        onDropItemToUnit(selectedItemId, unit.instanceId);
                        return;
                      }

                      onSelectUnit(unit.instanceId);
                    }
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
                  unit={unit}
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-[1rem] bg-white/[0.03] text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
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
