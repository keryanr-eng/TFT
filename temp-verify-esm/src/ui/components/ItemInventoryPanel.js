import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from "clsx";
import { itemById } from "../../data/itemData";
import { initials } from "../../utils/slugify";
import { clearDraggedItemId, setDraggedItemId } from "../dragData";
export function ItemInventoryPanel({ itemIds, selectedItemId, onSelectItem }) {
    return (_jsxs("section", { className: "relative overflow-visible rounded-[1.45rem] border border-black/10 bg-white/66 p-3 shadow-card backdrop-blur", children: [_jsxs("div", { className: "mb-2 flex items-center justify-between gap-2", children: [_jsx("h2", { className: "font-display text-base text-ink", children: "Items" }), _jsx("span", { className: "rounded-full bg-sunflower/24 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-ink", children: itemIds.length })] }), _jsx("div", { className: "grid grid-cols-3 gap-2", children: itemIds.length > 0 ? (itemIds.map((itemId, index) => {
                    const item = itemById[itemId];
                    if (!item) {
                        return null;
                    }
                    const iconLabel = initials(item.name);
                    const tooltipLine = item.kind === "component"
                        ? `${item.baseStat}${item.notes ? ` - ${item.notes}` : ""}`
                        : `${item.statLine}${item.effectDescription ? ` - ${item.effectDescription}` : ""}`;
                    return (_jsxs("div", { className: "group relative", children: [_jsx("button", { className: clsx("grid h-14 w-full place-items-center rounded-[0.95rem] border text-[11px] font-display shadow-sm transition hover:-translate-y-0.5", item.kind === "component"
                                    ? "border-coral/18 bg-white/88 text-coral"
                                    : "border-lagoon/18 bg-white/88 text-lagoon", selectedItemId === itemId && "border-lagoon bg-lagoon/10 ring-2 ring-lagoon/20"), draggable: true, onClick: () => onSelectItem(item.id), onDragEnd: () => {
                                    clearDraggedItemId();
                                }, onDragStart: (event) => {
                                    if (selectedItemId !== item.id) {
                                        onSelectItem(item.id);
                                    }
                                    setDraggedItemId(event, item.id);
                                }, type: "button", children: _jsx("span", { className: "text-sm", children: iconLabel }) }), _jsxs("div", { className: "pointer-events-none absolute left-full top-0 z-[140] ml-2 hidden w-56 rounded-[1rem] border border-black/12 bg-white px-3 py-3 text-left shadow-[0_22px_42px_rgba(31,37,48,0.24)] ring-1 ring-black/5 group-hover:block", children: [_jsx("p", { className: "font-display text-sm text-ink", children: item.name }), _jsx("p", { className: "mt-2 text-xs leading-relaxed text-ink/72", children: tooltipLine })] })] }, `${itemId}-${index}`));
                })) : (_jsx("div", { className: "col-span-3 rounded-[0.95rem] border border-dashed border-black/10 bg-white/56 px-3 py-3 text-[11px] text-ink/55", children: "Aucun item." })) })] }));
}
