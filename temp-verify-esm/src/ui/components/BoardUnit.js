import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from "clsx";
import { clearDraggedUnitId, getDraggedItemId, setDraggedUnitId } from "../dragData";
function renderStars(starLevel) {
    return Array.from({ length: starLevel }, (_, index) => (_jsx("span", { children: "\u2605" }, `${starLevel}-${index}`)));
}
export function BoardUnit({ unit, draggable = false, highlighted = false, itemIds = [], itemDropState = "idle", className, onHoverChange, onClick, onItemDrop, onItemDragStateChange, }) {
    const healthRatio = Math.max(0, Math.min(1, unit.currentHealth / unit.maxHealth));
    const manaRatio = Math.max(0, Math.min(1, unit.currentMana / unit.maxMana));
    const isItemEligible = itemDropState === "eligible" || itemDropState === "active";
    return (_jsxs("article", { className: clsx("relative grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] rounded-[1.2rem] border border-black/8 bg-white/94 px-2.5 py-2.5 transition duration-150", highlighted && "scale-[1.03] ring-4 ring-sunflower/24", isItemEligible && "ring-2 ring-lagoon/18", itemDropState === "active" && "ring-4 ring-lagoon/28 bg-lagoon/5", !unit.isAlive && "opacity-45 grayscale", draggable && "cursor-grab active:cursor-grabbing", onClick && "cursor-pointer", className), draggable: draggable, onClick: onClick, onDragEnd: draggable
            ? () => {
                clearDraggedUnitId();
            }
            : undefined, onDragEnter: onItemDragStateChange
            ? (event) => {
                if (!getDraggedItemId(event)) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                onItemDragStateChange(true);
            }
            : undefined, onDragLeave: onItemDragStateChange
            ? (event) => {
                if (!getDraggedItemId(event)) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                onItemDragStateChange(false);
            }
            : undefined, onDragOver: onItemDrop
            ? (event) => {
                if (!getDraggedItemId(event)) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                event.dataTransfer.dropEffect = "copy";
            }
            : undefined, onDrop: onItemDrop
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
            : undefined, onDragStart: draggable
            ? (event) => {
                setDraggedUnitId(event, unit.instanceId);
            }
            : undefined, onMouseEnter: onHoverChange ? () => onHoverChange(true) : undefined, onMouseLeave: onHoverChange ? () => onHoverChange(false) : undefined, style: {
            boxShadow: `0 8px 18px rgba(31,37,48,0.12)`,
        }, children: [_jsx("div", { className: "h-3.5 overflow-hidden rounded-full bg-ink/10", children: _jsx("div", { className: "h-full rounded-full bg-coral transition-[width] duration-150", style: { width: `${healthRatio * 100}%` } }) }), _jsxs("div", { className: "relative grid min-h-0 place-items-center py-2", children: [_jsx("div", { className: "relative grid h-14 w-14 place-items-center rounded-[1.2rem] border border-black/10 text-[26px] text-white shadow-[0_8px_18px_rgba(31,37,48,0.12)]", style: { backgroundColor: unit.template.ui.accentColor }, children: _jsx("span", { className: "font-display", children: unit.template.ui.iconText }) }), _jsx("div", { className: "absolute right-0 top-1 rounded-full bg-sunflower/92 px-2 py-0.5 text-[12px] font-display leading-none text-ink shadow-sm", children: renderStars(unit.starLevel) }), itemIds.length > 0 ? (_jsx("div", { className: "absolute bottom-1 right-0 flex items-center gap-1", children: itemIds.slice(0, 3).map((itemId, index) => (_jsx("span", { className: "h-2.5 w-2.5 rounded-full border border-white/80 bg-lagoon/70 shadow-sm" }, `${itemId}-${index}`))) })) : null] }), _jsx("div", { className: "h-3 overflow-hidden rounded-full bg-ink/10", children: _jsx("div", { className: "h-full rounded-full bg-blue-500 transition-[width] duration-150", style: { width: `${manaRatio * 100}%` } }) })] }));
}
