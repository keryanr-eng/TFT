import { useState } from "react";
import clsx from "clsx";
import type { RenderBoardCell } from "../../game/selectors";
import type { BoardDefinition, GamePhase } from "../../types/gameTypes";
import { getDraggedItemId, getDraggedUnitId } from "../dragData";
import { BoardUnit } from "./BoardUnit";

interface BoardProps {
  board: BoardDefinition;
  cells: RenderBoardCell[];
  phase: GamePhase;
  opponentLabel: string;
  highlightedUnitIds: string[];
  selectedItemId: string | null;
  onDropUnit: (unitId: string, row: number, column: number) => void;
  onDropItemToUnit: (itemId: string, unitId: string) => void;
  onHoverUnit: (unitId: string | null) => void;
  onPinUnit: (unitId: string) => void;
  onUnitDragStateChange: (unitId: string | null) => void;
}

export function Board({
  board,
  cells,
  phase,
  opponentLabel,
  highlightedUnitIds,
  selectedItemId,
  onDropUnit,
  onDropItemToUnit,
  onHoverUnit,
  onPinUnit,
  onUnitDragStateChange,
}: BoardProps) {
  const byKey = new Map(cells.map((cell) => [`${cell.side}-${cell.row}-${cell.column}`, cell.unit]));
  const canDrop = phase === "prep";
  const highlightedUnits = new Set(highlightedUnitIds);
  const [activeItemTargetUnitId, setActiveItemTargetUnitId] = useState<string | null>(null);

  return (
    <section className="tft-surface-hero relative flex h-full min-h-0 flex-col overflow-hidden rounded-[1.5rem] p-1.5 xl:p-2">
      <div className="pointer-events-none absolute inset-x-24 top-1 h-10 rounded-full bg-cyan-300/8 blur-2xl" />
      <div className="tft-hero-glow" />
      <div className="pointer-events-none absolute inset-x-20 bottom-4 h-10 rounded-full bg-cyan-200/6 blur-2xl" />

      <p className="pointer-events-none absolute left-4 top-3 z-20 max-w-[30%] truncate text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400/90">
        {opponentLabel}
      </p>

      <div className="tft-board-shell panel-grid relative z-10 flex-1 overflow-hidden rounded-[1.35rem] p-1.5 xl:p-1.75">
        <div className="pointer-events-none absolute inset-2 overflow-hidden rounded-[1.05rem]">
          <div className="absolute inset-x-0 top-0 h-1/2 bg-[linear-gradient(180deg,rgba(170,74,116,0.14)_0%,rgba(83,42,78,0.08)_46%,rgba(20,18,28,0)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,rgba(15,44,70,0)_0%,rgba(22,95,145,0.1)_46%,rgba(58,169,231,0.08)_100%)]" />
          <div className="absolute inset-x-0 top-1/2 h-11 -translate-y-1/2 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(10,14,22,0.72)_44%,rgba(10,14,22,0.72)_56%,rgba(255,255,255,0)_100%)]" />
          <div className="absolute inset-x-3 top-1/2 h-[4px] -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(151,214,255,0.98)_18%,rgba(255,146,189,0.98)_82%,rgba(255,255,255,0)_100%)] shadow-[0_0_18px_rgba(125,211,252,0.38)]" />
        </div>
        <div
          className="grid h-full gap-1 xl:gap-1.15"
          style={{
            gridTemplateColumns: `repeat(${board.columns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${board.awayRows + board.homeRows}, minmax(0, 1fr))`,
          }}
        >
          {[
            ...Array.from({ length: board.awayRows }, (_, row) => ({ side: "away" as const, row })),
            ...Array.from({ length: board.homeRows }, (_, row) => ({ side: "home" as const, row })),
          ].flatMap(({ side, row }, visualRow) =>
            Array.from({ length: board.columns }, (_, column) => {
              const unit = byKey.get(`${side}-${row}-${column}`) ?? null;
              const isDropTarget = side === "home" && canDrop;
              const equippedCount = unit ? unit.itemIds.length : 0;
              const canReceiveItem = Boolean(unit && side === "home" && canDrop && equippedCount < 3);

              return (
                <div
                  key={`${side}-${row}-${column}`}
                  className={clsx(
                    "min-h-0 rounded-[1rem] p-0.5 transition duration-150",
                    "tft-board-cell",
                    side === "away" ? "tft-board-cell-away" : "tft-board-cell-home",
                    side === "away" && "opacity-[0.98] saturate-[1.05]",
                    side === "home" && "saturate-[1.16]",
                    isDropTarget &&
                      "hover:z-10 hover:-translate-y-[2px] hover:scale-[1.02] hover:border-cyan-100 hover:shadow-[0_16px_24px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(186,230,253,0.58),0_0_0_2px_rgba(125,211,252,0.24)]",
                    visualRow === board.awayRows - 1 && "border-b border-b-cyan-100/30",
                  )}
                  onDragOver={
                    isDropTarget
                      ? (event) => {
                          event.preventDefault();
                        }
                      : undefined
                  }
                  onDrop={
                    isDropTarget
                      ? (event) => {
                          event.preventDefault();
                          const itemId = getDraggedItemId(event);
                          if (itemId && unit) {
                            onDropItemToUnit(itemId, unit.instanceId);
                            return;
                          }

                          const unitId = getDraggedUnitId(event);
                          if (unitId) {
                            onDropUnit(unitId, row, column);
                          }
                        }
                      : undefined
                  }
                >
                  {unit ? (
                    <BoardUnit
                      className="h-full"
                      draggable={canDrop && side === "home"}
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
                    <div className="tft-empty-slot h-full rounded-[0.85rem]" />
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>
    </section>
  );
}
