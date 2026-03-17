import { useEffect, useState, type DragEvent } from "react";
import clsx from "clsx";
import { getDraggedUnitId } from "../dragData";

interface SellZoneProps {
  canInteract: boolean;
  isDraggingUnit: boolean;
  unitName?: string;
  sellValue?: number;
  onSellUnit: (unitId: string) => void;
}

export function SellZone({
  canInteract,
  isDraggingUnit,
  unitName,
  sellValue,
  onSellUnit,
}: SellZoneProps) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isDraggingUnit) {
      setIsActive(false);
    }
  }, [isDraggingUnit]);

  if (!isDraggingUnit) {
    return null;
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!canInteract || !isDraggingUnit) {
      return;
    }

    const draggedUnitId = getDraggedUnitId(event);
    if (!draggedUnitId) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setIsActive(true);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    if (!canInteract) {
      return;
    }

    const draggedUnitId = getDraggedUnitId(event);
    if (!draggedUnitId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setIsActive(false);
    onSellUnit(draggedUnitId);
  }

  return (
    <div
      className={clsx(
        "min-w-[12.5rem] rounded-[1rem] border px-3 py-2 text-left transition duration-150 result-pop",
        "border-rose-300/42 bg-[linear-gradient(180deg,rgba(111,22,44,0.92)_0%,rgba(56,10,22,0.9)_100%)] shadow-[0_18px_34px_rgba(88,17,38,0.24),inset_0_1px_0_rgba(255,255,255,0.08)]",
        isActive &&
          "border-rose-200/70 bg-[linear-gradient(180deg,rgba(149,29,60,0.96)_0%,rgba(79,14,32,0.94)_100%)] shadow-[0_22px_40px_rgba(120,23,51,0.34),0_0_0_1px_rgba(255,189,214,0.08),inset_0_1px_0_rgba(255,255,255,0.12)] scale-[1.02]",
        canInteract ? "cursor-default" : "opacity-45",
      )}
      onDragEnter={
        canInteract && isDraggingUnit
          ? () => {
              setIsActive(true);
            }
          : undefined
      }
      onDragLeave={
        canInteract && isDraggingUnit
          ? () => {
              setIsActive(false);
            }
          : undefined
      }
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-2">
        <div
          className={clsx(
            "grid h-8 w-8 shrink-0 place-items-center rounded-[0.85rem] border text-sm font-display",
            "border-rose-200/30 bg-rose-300/14 text-rose-100",
            isActive && "border-rose-100/55 bg-rose-300/18 text-white",
          )}
        >
          $
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Zone de vente
          </p>
          <p
            className={clsx(
              "mt-0.5 text-[13px] font-semibold",
              "text-rose-50",
              isActive && "text-white",
            )}
          >
            Relacher ici pour vendre
          </p>
        </div>
      </div>

      {unitName && sellValue !== undefined ? (
        <p className="mt-1.5 text-[10px] font-semibold text-rose-100/95">
          {unitName} - {sellValue}g
        </p>
      ) : null}
    </div>
  );
}
