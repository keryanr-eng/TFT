"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemInventoryPanel = ItemInventoryPanel;
const jsx_runtime_1 = require("react/jsx-runtime");
const clsx_1 = __importDefault(require("clsx"));
const itemData_1 = require("../../data/itemData");
const slugify_1 = require("../../utils/slugify");
const dragData_1 = require("../dragData");
function ItemInventoryPanel({ itemIds, selectedItemId, onSelectItem }) {
    return ((0, jsx_runtime_1.jsxs)("section", { className: "relative overflow-visible rounded-[1.45rem] border border-black/10 bg-white/66 p-3 shadow-card backdrop-blur", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-2 flex items-center justify-between gap-2", children: [(0, jsx_runtime_1.jsx)("h2", { className: "font-display text-base text-ink", children: "Items" }), (0, jsx_runtime_1.jsx)("span", { className: "rounded-full bg-sunflower/24 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-ink", children: itemIds.length })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-3 gap-2", children: itemIds.length > 0 ? (itemIds.map((itemId, index) => {
                    const item = itemData_1.itemById[itemId];
                    if (!item) {
                        return null;
                    }
                    const iconLabel = (0, slugify_1.initials)(item.name);
                    const tooltipLine = item.kind === "component"
                        ? `${item.baseStat}${item.notes ? ` - ${item.notes}` : ""}`
                        : `${item.statLine}${item.effectDescription ? ` - ${item.effectDescription}` : ""}`;
                    return ((0, jsx_runtime_1.jsxs)("div", { className: "group relative", children: [(0, jsx_runtime_1.jsx)("button", { className: (0, clsx_1.default)("grid h-14 w-full place-items-center rounded-[0.95rem] border text-[11px] font-display shadow-sm transition hover:-translate-y-0.5", item.kind === "component"
                                    ? "border-coral/18 bg-white/88 text-coral"
                                    : "border-lagoon/18 bg-white/88 text-lagoon", selectedItemId === itemId && "border-lagoon bg-lagoon/10 ring-2 ring-lagoon/20"), draggable: true, onClick: () => onSelectItem(item.id), onDragEnd: () => {
                                    (0, dragData_1.clearDraggedItemId)();
                                }, onDragStart: (event) => {
                                    if (selectedItemId !== item.id) {
                                        onSelectItem(item.id);
                                    }
                                    (0, dragData_1.setDraggedItemId)(event, item.id);
                                }, type: "button", children: (0, jsx_runtime_1.jsx)("span", { className: "text-sm", children: iconLabel }) }), (0, jsx_runtime_1.jsxs)("div", { className: "pointer-events-none absolute left-full top-0 z-[140] ml-2 hidden w-56 rounded-[1rem] border border-black/12 bg-white px-3 py-3 text-left shadow-[0_22px_42px_rgba(31,37,48,0.24)] ring-1 ring-black/5 group-hover:block", children: [(0, jsx_runtime_1.jsx)("p", { className: "font-display text-sm text-ink", children: item.name }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-xs leading-relaxed text-ink/72", children: tooltipLine })] })] }, `${itemId}-${index}`));
                })) : ((0, jsx_runtime_1.jsx)("div", { className: "col-span-3 rounded-[0.95rem] border border-dashed border-black/10 bg-white/56 px-3 py-3 text-[11px] text-ink/55", children: "Aucun item." })) })] }));
}
