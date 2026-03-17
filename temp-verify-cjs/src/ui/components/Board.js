"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Board = Board;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const clsx_1 = __importDefault(require("clsx"));
const dragData_1 = require("../dragData");
const BoardUnit_1 = require("./BoardUnit");
function Board({ board, cells, phase, opponentLabel, highlightedUnitIds, selectedItemId, onDropUnit, onDropItemToUnit, onHoverUnit, }) {
    const byKey = new Map(cells.map((cell) => [`${cell.side}-${cell.row}-${cell.column}`, cell.unit]));
    const canDrop = phase === "prep";
    const highlightedUnits = new Set(highlightedUnitIds);
    const [activeItemTargetUnitId, setActiveItemTargetUnitId] = (0, react_1.useState)(null);
    return ((0, jsx_runtime_1.jsxs)("section", { className: "flex h-full min-h-0 flex-col rounded-[2rem] border border-black/10 bg-white/56 p-3 shadow-[0_26px_70px_rgba(31,37,48,0.16)] backdrop-blur", children: [(0, jsx_runtime_1.jsx)("div", { className: "mb-2 flex items-center justify-between px-1", children: (0, jsx_runtime_1.jsx)("p", { className: "truncate text-[11px] font-semibold uppercase tracking-[0.24em] text-ink/38", children: opponentLabel }) }), (0, jsx_runtime_1.jsx)("div", { className: "panel-grid flex-1 overflow-hidden rounded-[1.9rem] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(255,247,231,0.93)_100%)] p-3", children: (0, jsx_runtime_1.jsx)("div", { className: "grid h-full gap-2", style: {
                        gridTemplateColumns: `repeat(${board.columns}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${board.awayRows + board.homeRows}, minmax(0, 1fr))`,
                    }, children: [
                        ...Array.from({ length: board.awayRows }, (_, row) => ({ side: "away", row })),
                        ...Array.from({ length: board.homeRows }, (_, row) => ({ side: "home", row })),
                    ].flatMap(({ side, row }, visualRow) => Array.from({ length: board.columns }, (_, column) => {
                        const unit = byKey.get(`${side}-${row}-${column}`) ?? null;
                        const isDropTarget = side === "home" && canDrop;
                        const equippedCount = unit ? unit.itemIds.length : 0;
                        const canReceiveItem = Boolean(unit && side === "home" && canDrop && equippedCount < 3);
                        return ((0, jsx_runtime_1.jsx)("div", { className: (0, clsx_1.default)("min-h-0 rounded-[1.4rem] p-1 transition", side === "away" ? "bg-white/28" : "bg-white/46", isDropTarget && "hover:bg-lagoon/5", visualRow === board.awayRows - 1 && "border-b border-b-lagoon/18"), onDragOver: isDropTarget
                                ? (event) => {
                                    event.preventDefault();
                                }
                                : undefined, onDrop: isDropTarget
                                ? (event) => {
                                    event.preventDefault();
                                    const itemId = (0, dragData_1.getDraggedItemId)(event);
                                    if (itemId && unit) {
                                        onDropItemToUnit(itemId, unit.instanceId);
                                        return;
                                    }
                                    const unitId = (0, dragData_1.getDraggedUnitId)(event);
                                    if (unitId) {
                                        onDropUnit(unitId, row, column);
                                    }
                                }
                                : undefined, children: unit ? ((0, jsx_runtime_1.jsx)(BoardUnit_1.BoardUnit, { className: "h-full", draggable: canDrop && side === "home", highlighted: highlightedUnits.has(unit.instanceId), itemIds: unit.itemIds, itemDropState: canReceiveItem
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
                                    : undefined, unit: unit })) : ((0, jsx_runtime_1.jsx)("div", { className: "h-full rounded-[1.2rem] bg-white/20" })) }, `${side}-${row}-${column}`));
                    })) }) })] }));
}
