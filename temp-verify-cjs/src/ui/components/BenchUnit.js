"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BenchUnit = BenchUnit;
const jsx_runtime_1 = require("react/jsx-runtime");
const clsx_1 = __importDefault(require("clsx"));
const dragData_1 = require("../dragData");
function renderStars(starLevel) {
    return Array.from({ length: starLevel }, (_, index) => ((0, jsx_runtime_1.jsx)("span", { children: "\u2605" }, `${starLevel}-${index}`)));
}
function BenchUnit({ unit, draggable = false, highlighted = false, itemIds = [], itemDropState = "idle", className, onHoverChange, onClick, onItemDrop, onItemDragStateChange, }) {
    const healthRatio = Math.max(0, Math.min(1, unit.currentHealth / unit.maxHealth));
    const manaRatio = Math.max(0, Math.min(1, unit.currentMana / unit.maxMana));
    const isItemEligible = itemDropState === "eligible" || itemDropState === "active";
    return ((0, jsx_runtime_1.jsxs)("article", { className: (0, clsx_1.default)("grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto_auto] rounded-[1rem] border border-black/10 bg-white/94 px-2.5 py-2.5 shadow-sm transition duration-150", highlighted && "scale-[1.02] ring-4 ring-sunflower/22", isItemEligible && "ring-2 ring-lagoon/18", itemDropState === "active" && "ring-4 ring-lagoon/28 bg-lagoon/5", !unit.isAlive && "opacity-45 grayscale", draggable && "cursor-grab active:cursor-grabbing", onClick && "cursor-pointer", className), draggable: draggable, onClick: onClick, onDragEnd: draggable
            ? () => {
                (0, dragData_1.clearDraggedUnitId)();
            }
            : undefined, onDragEnter: onItemDragStateChange
            ? (event) => {
                if (!(0, dragData_1.getDraggedItemId)(event)) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                onItemDragStateChange(true);
            }
            : undefined, onDragLeave: onItemDragStateChange
            ? (event) => {
                if (!(0, dragData_1.getDraggedItemId)(event)) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                onItemDragStateChange(false);
            }
            : undefined, onDragOver: onItemDrop
            ? (event) => {
                if (!(0, dragData_1.getDraggedItemId)(event)) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                event.dataTransfer.dropEffect = "copy";
            }
            : undefined, onDrop: onItemDrop
            ? (event) => {
                const itemId = (0, dragData_1.getDraggedItemId)(event);
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
                (0, dragData_1.setDraggedUnitId)(event, unit.instanceId);
            }
            : undefined, onMouseEnter: onHoverChange ? () => onHoverChange(true) : undefined, onMouseLeave: onHoverChange ? () => onHoverChange(false) : undefined, style: {
            boxShadow: `0 8px 18px rgba(31,37,48,0.1)`,
        }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between gap-2", children: [(0, jsx_runtime_1.jsxs)("span", { className: "rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white", children: [unit.template.cost, "g"] }), (0, jsx_runtime_1.jsx)("span", { className: "rounded-full bg-sunflower/92 px-2 py-0.5 text-[12px] font-display leading-none text-ink", children: renderStars(unit.starLevel) })] }), (0, jsx_runtime_1.jsx)("div", { className: "relative grid min-h-0 place-items-center py-1.5", children: (0, jsx_runtime_1.jsx)("div", { className: "relative grid h-11 w-11 place-items-center rounded-[1rem] border border-black/10 text-[22px] text-white shadow-[0_6px_14px_rgba(31,37,48,0.1)]", style: { backgroundColor: unit.template.ui.accentColor }, children: (0, jsx_runtime_1.jsx)("span", { className: "font-display", children: unit.template.ui.iconText }) }) }), (0, jsx_runtime_1.jsx)("p", { className: "truncate text-center font-display text-[12px] leading-none text-ink", children: unit.template.name }), itemIds.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "mt-1 flex items-center justify-center gap-1", children: itemIds.slice(0, 3).map((itemId, index) => ((0, jsx_runtime_1.jsx)("span", { className: "h-2.5 w-2.5 rounded-full border border-white/90 bg-lagoon/70 shadow-sm" }, `${itemId}-${index}`))) })) : null, (0, jsx_runtime_1.jsxs)("div", { className: "mt-1.5 space-y-1", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-2.5 overflow-hidden rounded-full bg-ink/10", children: (0, jsx_runtime_1.jsx)("div", { className: "h-full rounded-full bg-coral transition-[width] duration-150", style: { width: `${healthRatio * 100}%` } }) }), (0, jsx_runtime_1.jsx)("div", { className: "h-2 overflow-hidden rounded-full bg-ink/10", children: (0, jsx_runtime_1.jsx)("div", { className: "h-full rounded-full bg-blue-500 transition-[width] duration-150", style: { width: `${manaRatio * 100}%` } }) })] })] }));
}
