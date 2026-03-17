import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { getDraggedItemId, getDraggedUnitId } from "../dragData";
import { BenchUnit } from "./BenchUnit";
export function Bench({ slots, phase, highlightedUnitIds, selectedItemId, onDropUnit, onDropItemToUnit, onHoverUnit, }) {
    const canDrop = phase === "prep";
    const filledSlots = slots.filter((slot) => slot.unit !== null).length;
    const highlightedUnits = new Set(highlightedUnitIds);
    const [activeItemTargetUnitId, setActiveItemTargetUnitId] = useState(null);
    return (_jsxs("section", { className: "rounded-[1.5rem] border border-black/10 bg-white/72 p-3 shadow-card backdrop-blur", children: [_jsxs("div", { className: "mb-2 flex items-center justify-between gap-3", children: [_jsx("h2", { className: "font-display text-lg text-ink", children: "Bench" }), _jsxs("span", { className: "rounded-full bg-sunflower/24 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink", children: [filledSlots, "/", slots.length] })] }), _jsx("div", { className: "grid grid-cols-9 gap-2", children: slots.map((slot) => {
                    const unit = slot.unit;
                    const equippedCount = unit ? unit.itemIds.length : 0;
                    const canReceiveItem = Boolean(unit && canDrop && equippedCount < 3);
                    return (_jsx("div", { className: "h-32 rounded-[1.1rem] bg-shell/68 p-1.5 transition hover:bg-white/82", onDragOver: canDrop
                            ? (event) => {
                                event.preventDefault();
                            }
                            : undefined, onDrop: canDrop
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
                            : undefined, children: unit ? (_jsx(BenchUnit, { className: "h-full", draggable: canDrop, highlighted: highlightedUnits.has(unit.instanceId), itemIds: unit.itemIds, itemDropState: canReceiveItem
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
                                : undefined, unit: unit })) : (_jsx("div", { className: "flex h-full items-center justify-center rounded-[1rem] bg-white/32 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/24", children: slot.slotIndex + 1 })) }, `bench-slot-${slot.slotIndex}`));
                }) })] }));
}
