import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { getCombatResultSummary, getDebugSnapshot, getHumanActiveSynergies, getHumanBench, getHumanItemInventory, getHumanPlayer, getOpponentPlayer, getRenderBoard, } from "./game/selectors";
import { useGameStore } from "./store/gameStore";
import { Bench } from "./ui/components/Bench";
import { Board } from "./ui/components/Board";
import { BoardActionBar } from "./ui/components/BoardActionBar";
import { CombatResultOverlay } from "./ui/components/CombatResultOverlay";
import { DebugPanel } from "./ui/components/DebugPanel";
import { FeedbackToast } from "./ui/components/FeedbackToast";
import { HUD } from "./ui/components/HUD";
import { ItemInventoryPanel } from "./ui/components/ItemInventoryPanel";
import { RoundSidebar } from "./ui/components/RoundSidebar";
import { Shop } from "./ui/components/Shop";
import { SynergyPanel } from "./ui/components/SynergyPanel";
import { useInterfaceFeedback } from "./ui/useInterfaceFeedback";
import { UnitStatsPanel } from "./ui/components/UnitStatsPanel";
function App() {
    const { game, moveUnit, rerollShop, buyUnit, buyExperience, equipItem, startCombat, tickCombat, advanceRound, resetGame } = useGameStore(useShallow((state) => ({
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
    const player = getHumanPlayer(game);
    const opponent = getOpponentPlayer(game);
    const boardCells = getRenderBoard(game);
    const benchSlots = getHumanBench(game);
    const inventoryItemIds = getHumanItemInventory(game);
    const activeSynergies = getHumanActiveSynergies(game);
    const combatResult = getCombatResultSummary(game);
    const debugSnapshot = getDebugSnapshot(game);
    const latestLogEntry = game.log[0] ?? null;
    const [hoveredUnitId, setHoveredUnitId] = useState(null);
    const [hoveredShopUnit, setHoveredShopUnit] = useState(null);
    const [selectedItemId, setSelectedItemId] = useState(null);
    const hoveredUnits = useMemo(() => {
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
    const { highlightedUnitIds, latestToast, goldDelta } = useInterfaceFeedback(boardCells, benchSlots, latestLogEntry, player.economy.gold, game.phase);
    const isDev = import.meta.env.DEV;
    useEffect(() => {
        if (!hoveredUnitId || hoveredUnits.has(hoveredUnitId)) {
            return;
        }
        setHoveredUnitId(null);
    }, [hoveredUnitId, hoveredUnits]);
    useEffect(() => {
        if (!hoveredUnitId) {
            return;
        }
        setHoveredShopUnit(null);
    }, [hoveredUnitId]);
    useEffect(() => {
        if (!selectedItemId) {
            return;
        }
        if (inventoryItemIds.includes(selectedItemId)) {
            return;
        }
        setSelectedItemId(null);
    }, [inventoryItemIds, selectedItemId]);
    useEffect(() => {
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
    return (_jsx("div", { className: "h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,132,92,0.18),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(111,211,192,0.2),_transparent_18%),linear-gradient(180deg,_#fff7e7_0%,_#ffe9d2_100%)] text-ink", children: _jsxs("div", { className: "relative mx-auto grid h-full max-w-[1750px] grid-rows-[auto_minmax(0,1fr)] gap-2 p-2.5 xl:p-3", children: [_jsx(HUD, { player: player, round: game.round }), _jsxs("div", { className: "grid min-h-0 gap-3 xl:grid-cols-[11.5rem_minmax(0,1fr)_13rem]", children: [_jsxs("aside", { className: "relative z-30 flex min-h-0 flex-col gap-2.5 overflow-visible", children: [_jsx(SynergyPanel, { activeSynergies: activeSynergies }), _jsx(ItemInventoryPanel, { itemIds: inventoryItemIds, onSelectItem: (itemId) => {
                                        setSelectedItemId((current) => (current === itemId ? null : itemId));
                                    }, selectedItemId: selectedItemId })] }), _jsxs("div", { className: "relative z-10 grid min-h-0 grid-rows-[minmax(0,1fr)_auto_auto_auto] gap-2.5", children: [_jsxs("div", { className: "relative min-h-0", children: [_jsx(Board, { board: game.board, cells: boardCells, highlightedUnitIds: highlightedUnitIds, onDropItemToUnit: (itemId, unitId) => {
                                                equipItem(itemId, unitId);
                                                setSelectedItemId(null);
                                            }, onDropUnit: (unitId, row, column) => moveUnit(unitId, {
                                                type: "board",
                                                row,
                                                column,
                                            }), onHoverUnit: (unitId) => {
                                                setHoveredShopUnit(null);
                                                setHoveredUnitId(unitId);
                                            }, opponentLabel: opponent?.name ?? game.round.enemyLabel, phase: game.phase, selectedItemId: selectedItemId }), _jsx(FeedbackToast, { entry: latestToast }), _jsx(CombatResultOverlay, { isGameOver: game.phase === "gameOver", onAdvance: advanceRound, onReset: resetGame, result: combatResult })] }), _jsx(BoardActionBar, { onAdvanceRound: advanceRound, onReset: resetGame, onStartCombat: startCombat, phase: game.phase }), _jsx(Bench, { highlightedUnitIds: highlightedUnitIds, onDropItemToUnit: (itemId, unitId) => {
                                        equipItem(itemId, unitId);
                                        setSelectedItemId(null);
                                    }, onDropUnit: (unitId, slotIndex) => moveUnit(unitId, {
                                        type: "bench",
                                        slotIndex,
                                    }), onHoverUnit: (unitId) => {
                                        setHoveredShopUnit(null);
                                        setHoveredUnitId(unitId);
                                    }, phase: game.phase, selectedItemId: selectedItemId, slots: benchSlots }), _jsx(Shop, { currentXp: player.experience.currentXp, gold: player.economy.gold, goldDelta: goldDelta, level: player.experience.level, onBuyExperience: buyExperience, onBuyUnit: buyUnit, onHoverUnit: (unit) => {
                                        setHoveredUnitId(null);
                                        setHoveredShopUnit(unit);
                                    }, onReroll: rerollShop, phase: game.phase, shop: player.shop, xpToNext: player.experience.xpToNext })] }), _jsxs("aside", { className: "relative z-30 flex min-h-0 flex-col gap-2.5 overflow-visible", children: [_jsx(RoundSidebar, { livingBots: livingBots, players: lobbyPlayers, phase: game.phase, round: game.round, opponentLabel: opponent?.name ?? game.round.enemyLabel }), _jsx(UnitStatsPanel, { equippedItemIds: hoveredUnitItems, unit: hoveredUnit })] })] }), isDev && (_jsx("div", { className: "pointer-events-none absolute bottom-2.5 left-2.5 z-30", children: _jsx("div", { className: "pointer-events-auto", children: _jsx(DebugPanel, { snapshot: debugSnapshot }) }) }))] }) }));
}
export default App;
