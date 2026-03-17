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
  onSelectUnit: (unitId: string) => void;
  onSellUnit: (unitId: string) => void;
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
  onSelectUnit,
  onSellUnit,
  onUnitDragStateChange,
}: BoardProps) {
  const byKey = new Map(cells.map((cell) => [`${cell.side}-${cell.row}-${cell.column}`, cell.unit]));
  const canDrop = phase === "prep";
  const highlightedUnits = new Set(highlightedUnitIds);
  const [activeItemTargetUnitId, setActiveItemTargetUnitId] = useState<string | null>(null);

  return (
    <section className="tft-surface-hero relative flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] p-2.5 xl:p-3">
      <div className="pointer-events-none absolute inset-x-20 top-0 h-20 rounded-full bg-cyan-300/8 blur-3xl" />
      <div className="tft-hero-glow" />

      <div className="relative z-10 mb-2 flex items-center justify-between px-1">
        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          {opponentLabel}
        </p>
      </div>

      <div className="tft-board-shell panel-grid relative z-10 flex-1 overflow-hidden rounded-[1.9rem] p-2.5 xl:p-3">
        <div className="pointer-events-none absolute inset-3 overflow-hidden rounded-[1.45rem]">
          <div className="absolute inset-x-0 top-0 h-1/2 bg-[linear-gradient(180deg,rgba(160,82,102,0.1)_0%,rgba(82,39,56,0.04)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,rgba(18,60,82,0.04)_0%,rgba(52,157,201,0.08)_100%)]" />
          <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(148,197,255,0.38)_18%,rgba(148,197,255,0.38)_82%,rgba(255,255,255,0)_100%)] shadow-[0_0_18px_rgba(125,211,252,0.14)]" />
        </div>
        <div
          className="grid h-full gap-1.5 xl:gap-2"
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
                    "min-h-0 rounded-[1.45rem] p-1 transition",
                    "tft-board-cell",
                    side === "away" ? "tft-board-cell-away" : "tft-board-cell-home",
                    isDropTarget && "hover:border-cyan-300/24 hover:bg-cyan-400/6 hover:shadow-[inset_0_0_0_1px_rgba(103,232,249,0.08)]",
                    visualRow === board.awayRows - 1 && "border-b border-b-cyan-300/10",
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
                      onSell={
                        canDrop && side === "home"
                          ? () => {
                              onSellUnit(unit.instanceId);
                            }
                          : undefined
                      }
                      onUnitDragStateChange={onUnitDragStateChange}
                      unit={unit}
                    />
                  ) : (
                    <div className="tft-empty-slot h-full rounded-[1.2rem]" />
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
