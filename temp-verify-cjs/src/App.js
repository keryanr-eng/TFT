"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const shallow_1 = require("zustand/react/shallow");
const selectors_1 = require("./game/selectors");
const gameStore_1 = require("./store/gameStore");
const Bench_1 = require("./ui/components/Bench");
const Board_1 = require("./ui/components/Board");
const BoardActionBar_1 = require("./ui/components/BoardActionBar");
const CombatResultOverlay_1 = require("./ui/components/CombatResultOverlay");
const DebugPanel_1 = require("./ui/components/DebugPanel");
const FeedbackToast_1 = require("./ui/components/FeedbackToast");
const HUD_1 = require("./ui/components/HUD");
const ItemInventoryPanel_1 = require("./ui/components/ItemInventoryPanel");
const RoundSidebar_1 = require("./ui/components/RoundSidebar");
const Shop_1 = require("./ui/components/Shop");
const SynergyPanel_1 = require("./ui/components/SynergyPanel");
const useInterfaceFeedback_1 = require("./ui/useInterfaceFeedback");
const UnitStatsPanel_1 = require("./ui/components/UnitStatsPanel");
function App() {
    const { game, moveUnit, rerollShop, buyUnit, buyExperience, equipItem, startCombat, tickCombat, advanceRound, resetGame } = (0, gameStore_1.useGameStore)((0, shallow_1.useShallow)((state) => ({
        game: state.game,
        moveUnit: state.moveUnit,
        rerollShop: state.rerollShop,
        buyUnit: state.buyUnit,
        buyExperience: state.buyExperience,
        equipItem: state.equipItem,
        startCombat: state.startCombat,
        tickCombat: state.tickCombat,
        advanceRound: state.advanceRound,
        resetGame: state.resetGame,
    })));
    const player = (0, selectors_1.getHumanPlayer)(game);
    const opponent = (0, selectors_1.getOpponentPlayer)(game);
    const boardCells = (0, selectors_1.getRenderBoard)(game);
    const benchSlots = (0, selectors_1.getHumanBench)(game);
    const inventoryItemIds = (0, selectors_1.getHumanItemInventory)(game);
    const activeSynergies = (0, selectors_1.getHumanActiveSynergies)(game);
    const combatResult = (0, selectors_1.getCombatResultSummary)(game);
    const debugSnapshot = (0, selectors_1.getDebugSnapshot)(game);
    const latestLogEntry = game.log[0] ?? null;
    const [hoveredUnitId, setHoveredUnitId] = (0, react_1.useState)(null);
    const [hoveredShopUnit, setHoveredShopUnit] = (0, react_1.useState)(null);
    const [selectedItemId, setSelectedItemId] = (0, react_1.useState)(null);
    const hoveredUnits = (0, react_1.useMemo)(() => {
        const units = new Map();
        for (const cell of boardCells) {
            if (cell.unit) {
                units.set(cell.unit.instanceId, cell.unit);
            }
        }
        for (const slot of benchSlots) {
            if (slot.unit) {
                units.set(slot.unit.instanceId, slot.unit);
            }
        }
        return units;
    }, [benchSlots, boardCells]);
    const hoveredUnit = hoveredUnitId ? hoveredUnits.get(hoveredUnitId) ?? null : hoveredShopUnit;
    const hoveredUnitItems = hoveredUnit?.itemIds ?? [];
    const lobbyPlayers = [
        {
            id: player.id,
            name: "Vous",
            health: player.health,
            isHuman: true,
        },
        ...game.playerOrder
            .map((playerId) => game.players[playerId])
            .filter((entry) => entry && entry.kind === "bot")
            .map((entry) => ({
            id: entry.id,
            name: entry.name,
            health: entry.health,
            isHuman: false,
        })),
    ];
    const livingBots = lobbyPlayers.filter((entry) => !entry.isHuman && entry.health > 0).length;
    const { highlightedUnitIds, latestToast, goldDelta } = (0, useInterfaceFeedback_1.useInterfaceFeedback)(boardCells, benchSlots, latestLogEntry, player.economy.gold, game.phase);
    const isDev = import.meta.env.DEV;
    (0, react_1.useEffect)(() => {
        if (!hoveredUnitId || hoveredUnits.has(hoveredUnitId)) {
            return;
        }
        setHoveredUnitId(null);
    }, [hoveredUnitId, hoveredUnits]);
    (0, react_1.useEffect)(() => {
        if (!hoveredUnitId) {
            return;
        }
        setHoveredShopUnit(null);
    }, [hoveredUnitId]);
    (0, react_1.useEffect)(() => {
        if (!selectedItemId) {
            return;
        }
        if (inventoryItemIds.includes(selectedItemId)) {
            return;
        }
        setSelectedItemId(null);
    }, [inventoryItemIds, selectedItemId]);
    (0, react_1.useEffect)(() => {
        if (game.phase !== "combat") {
            return undefined;
        }
        const interval = window.setInterval(() => {
            tickCombat(180);
        }, 180);
        return () => {
            window.clearInterval(interval);
        };
    }, [game.phase, tickCombat]);
    return ((0, jsx_runtime_1.jsx)("div", { className: "h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,132,92,0.18),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(111,211,192,0.2),_transparent_18%),linear-gradient(180deg,_#fff7e7_0%,_#ffe9d2_100%)] text-ink", children: (0, jsx_runtime_1.jsxs)("div", { className: "relative mx-auto grid h-full max-w-[1750px] grid-rows-[auto_minmax(0,1fr)] gap-2 p-2.5 xl:p-3", children: [(0, jsx_runtime_1.jsx)(HUD_1.HUD, { player: player, round: game.round }), (0, jsx_runtime_1.jsxs)("div", { className: "grid min-h-0 gap-3 xl:grid-cols-[11.5rem_minmax(0,1fr)_13rem]", children: [(0, jsx_runtime_1.jsxs)("aside", { className: "relative z-30 flex min-h-0 flex-col gap-2.5 overflow-visible", children: [(0, jsx_runtime_1.jsx)(SynergyPanel_1.SynergyPanel, { activeSynergies: activeSynergies }), (0, jsx_runtime_1.jsx)(ItemInventoryPanel_1.ItemInventoryPanel, { itemIds: inventoryItemIds, onSelectItem: (itemId) => {
                                        setSelectedItemId((current) => (current === itemId ? null : itemId));
                                    }, selectedItemId: selectedItemId })] }), (0, jsx_runtime_1.jsxs)("div", { className: "relative z-10 grid min-h-0 grid-rows-[minmax(0,1fr)_auto_auto_auto] gap-2.5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative min-h-0", children: [(0, jsx_runtime_1.jsx)(Board_1.Board, { board: game.board, cells: boardCells, highlightedUnitIds: highlightedUnitIds, onDropItemToUnit: (itemId, unitId) => {
                                                equipItem(itemId, unitId);
                                                setSelectedItemId(null);
                                            }, onDropUnit: (unitId, row, column) => moveUnit(unitId, {
                                                type: "board",
                                                row,
                                                column,
                                            }), onHoverUnit: (unitId) => {
                                                setHoveredShopUnit(null);
                                                setHoveredUnitId(unitId);
                                            }, opponentLabel: opponent?.name ?? game.round.enemyLabel, phase: game.phase, selectedItemId: selectedItemId }), (0, jsx_runtime_1.jsx)(FeedbackToast_1.FeedbackToast, { entry: latestToast }), (0, jsx_runtime_1.jsx)(CombatResultOverlay_1.CombatResultOverlay, { isGameOver: game.phase === "gameOver", onAdvance: advanceRound, onReset: resetGame, result: combatResult })] }), (0, jsx_runtime_1.jsx)(BoardActionBar_1.BoardActionBar, { onAdvanceRound: advanceRound, onReset: resetGame, onStartCombat: startCombat, phase: game.phase }), (0, jsx_runtime_1.jsx)(Bench_1.Bench, { highlightedUnitIds: highlightedUnitIds, onDropItemToUnit: (itemId, unitId) => {
                                        equipItem(itemId, unitId);
                                        setSelectedItemId(null);
                                    }, onDropUnit: (unitId, slotIndex) => moveUnit(unitId, {
                                        type: "bench",
                                        slotIndex,
                                    }), onHoverUnit: (unitId) => {
                                        setHoveredShopUnit(null);
                                        setHoveredUnitId(unitId);
                                    }, phase: game.phase, selectedItemId: selectedItemId, slots: benchSlots }), (0, jsx_runtime_1.jsx)(Shop_1.Shop, { currentXp: player.experience.currentXp, gold: player.economy.gold, goldDelta: goldDelta, level: player.experience.level, onBuyExperience: buyExperience, onBuyUnit: buyUnit, onHoverUnit: (unit) => {
                                        setHoveredUnitId(null);
                                        setHoveredShopUnit(unit);
                                    }, onReroll: rerollShop, phase: game.phase, shop: player.shop, xpToNext: player.experience.xpToNext })] }), (0, jsx_runtime_1.jsxs)("aside", { className: "relative z-30 flex min-h-0 flex-col gap-2.5 overflow-visible", children: [(0, jsx_runtime_1.jsx)(RoundSidebar_1.RoundSidebar, { livingBots: livingBots, players: lobbyPlayers, phase: game.phase, round: game.round, opponentLabel: opponent?.name ?? game.round.enemyLabel }), (0, jsx_runtime_1.jsx)(UnitStatsPanel_1.UnitStatsPanel, { equippedItemIds: hoveredUnitItems, unit: hoveredUnit })] })] }), isDev && ((0, jsx_runtime_1.jsx)("div", { className: "pointer-events-none absolute bottom-2.5 left-2.5 z-30", children: (0, jsx_runtime_1.jsx)("div", { className: "pointer-events-auto", children: (0, jsx_runtime_1.jsx)(DebugPanel_1.DebugPanel, { snapshot: debugSnapshot }) }) }))] }) }));
}
exports.default = App;
