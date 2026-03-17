import type { DragEvent } from "react";
import clsx from "clsx";
import { itemById } from "../../data/itemData";
import { initials } from "../../utils/slugify";
import { clearDraggedItemId, setDraggedItemId } from "../dragData";

interface ItemInventoryPanelProps {
  itemIds: string[];
  selectedItemId: string | null;
  onSelectItem: (itemId: string) => void;
}

export function ItemInventoryPanel({ itemIds, selectedItemId, onSelectItem }: ItemInventoryPanelProps) {
  return (
    <section className="tft-surface relative overflow-visible rounded-[1.45rem] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="tft-heading font-display text-base">Items</h2>
        <span className="rounded-full border border-amber-300/20 bg-amber-300/12 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-amber-100">
          {itemIds.length}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {itemIds.length > 0 ? (
          itemIds.map((itemId, index) => {
            const item = itemById[itemId];
            if (!item) {
              return null;
            }

            const iconLabel = initials(item.name);
            const tooltipLine =
              item.kind === "component"
                ? `${item.baseStat}${item.notes ? ` - ${item.notes}` : ""}`
                : `${item.statLine}${item.effectDescription ? ` - ${item.effectDescription}` : ""}`;

            return (
              <div key={`${itemId}-${index}`} className="group relative">
                <button
                  className={clsx(
                    "grid h-14 w-full place-items-center rounded-[0.95rem] border text-[11px] font-display shadow-sm transition hover:-translate-y-0.5",
                    item.kind === "component"
                      ? "border-orange-300/18 bg-white/[0.05] text-orange-100"
                      : "border-cyan-300/18 bg-white/[0.05] text-cyan-100",
                    selectedItemId === itemId && "border-cyan-300/55 bg-cyan-400/10 ring-2 ring-cyan-300/20",
                  )}
                  draggable
                  onClick={() => onSelectItem(item.id)}
                  onDragEnd={() => {
                    clearDraggedItemId();
                  }}
                  onDragStart={(event: DragEvent<HTMLButtonElement>) => {
                    if (selectedItemId !== item.id) {
                      onSelectItem(item.id);
                    }
                    setDraggedItemId(event, item.id);
                  }}
                  type="button"
                >
                  <span className="text-sm">{iconLabel}</span>
                </button>

                <div className="tft-tooltip pointer-events-none absolute left-full top-0 z-[140] ml-2 hidden w-56 rounded-[1rem] px-3 py-3 text-left group-hover:block">
                  <p className="font-display text-sm text-slate-100">{item.name}</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-200/86">{tooltipLine}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-3 rounded-[0.95rem] border border-dashed border-white/10 bg-white/[0.04] px-3 py-3 text-[11px] text-slate-400">
            Aucun item.
          </div>
        )}
      </div>
    </section>
  );
}
