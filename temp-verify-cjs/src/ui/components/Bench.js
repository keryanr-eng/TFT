"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bench = Bench;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const dragData_1 = require("../dragData");
const BenchUnit_1 = require("./BenchUnit");
function Bench({ slots, phase, highlightedUnitIds, selectedItemId, onDropUnit, onDropItemToUnit, onHoverUnit, }) {
    const canDrop = phase === "prep";
    const filledSlots = slots.filter((slot) => slot.unit !== null).length;
    const highlightedUnits = new Set(highlightedUnitIds);
    const [activeItemTargetUnitId, setActiveItemTargetUnitId] = (0, react_1.useState)(null);
    return ((0, jsx_runtime_1.jsxs)("section", { className: "rounded-[1.5rem] border border-black/10 bg-white/72 p-3 shadow-card backdrop-blur", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-2 flex items-center justify-between gap-3", children: [(0, jsx_runtime_1.jsx)("h2", { className: "font-display text-lg text-ink", children: "Bench" }), (0, jsx_runtime_1.jsxs)("span", { className: "rounded-full bg-sunflower/24 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink", children: [filledSlots, "/", slots.length] })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-9 gap-2", children: slots.map((slot) => {
                    const unit = slot.unit;
                    const equippedCount = unit ? unit.itemIds.length : 0;
                    const canReceiveItem = Boolean(unit && canDrop && equippedCount < 3);
                    return ((0, jsx_runtime_1.jsx)("div", { className: "h-32 rounded-[1.1rem] bg-shell/68 p-1.5 transition hover:bg-white/82", onDragOver: canDrop
                            ? (event) => {
                                event.preventDefault();
                            }
                            : undefined, onDrop: canDrop
                            ? (event) => {
                                event.preventDefault();
                                const itemId = (0, dragData_1.getDraggedItemId)(event);
                                if (itemId && unit) {
                                    onDropItemToUnit(itemId, unit.instanceId);
                                    return;
                                }
                                const unitId = (0, dragData_1.getDraggedUnitId)(event);
                                if (unitId) {
                                    onDropUnit(unitId, slot.slotIndex);
                                }
                            }
                            : undefined, children: unit ? ((0, jsx_runtime_1.jsx)(BenchUnit_1.BenchUnit, { className: "h-full", draggable: canDrop, highlighted: highlightedUnits.has(unit.instanceId), itemIds: unit.itemIds, itemDropState: canReceiveItem
                                ? activeItemTargetUnitId === unit.instanceId
                                    ? "active"
                                    : selectedItemId
                                        ? "eligible"
                                        : "idle"
                                : "idle", onClick: selectedItemId && canReceiveItem
                                ? () => {
                                    onDropItemToUnit(selectedItemId, unit.instanceId);
                                }
                                : undefined, onHoverChange: (isHovered) => onHoverUnit(isHovered ? unit.instanceId : null), onItemDragStateChange: canReceiveItem
                                ? (isActive) => {
                                    setActiveItemTargetUnitId(isActive ? unit.instanceId : null);
                                }
                                : undefined, onItemDrop: canReceiveItem
                                ? (itemId) => {
                                    onDropItemToUnit(itemId, unit.instanceId);
                                }
                                : undefined, unit: unit })) : ((0, jsx_runtime_1.jsx)("div", { className: "flex h-full items-center justify-center rounded-[1rem] bg-white/32 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/24", children: slot.slotIndex + 1 })) }, `bench-slot-${slot.slotIndex}`));
                }) })] }));
}
