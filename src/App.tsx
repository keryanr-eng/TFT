import { useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  getCombatResultSummary,
  getDebugSnapshot,
  getHumanActiveSynergies,
  getHumanBench,
  getHumanItemInventory,
  getHumanPlayer,
  getOpponentPlayer,
  getRenderBoard,
  type RenderUnitState,
} from "./game/selectors";
import { getUnitSellValue } from "./systems/economySystem";
import { useGameStore } from "./store/gameStore";
import { Bench } from "./ui/components/Bench";
import { Board } from "./ui/components/Board";
import { CombatResultOverlay } from "./ui/components/CombatResultOverlay";
import { DebugPanel } from "./ui/components/DebugPanel";
import { FeedbackToast } from "./ui/components/FeedbackToast";
import { HUD } from "./ui/components/HUD";
import { ItemInventoryPanel } from "./ui/components/ItemInventoryPanel";
import { LobbyHealthPanel } from "./ui/components/LobbyHealthPanel";
import { Shop } from "./ui/components/Shop";
import { SynergyPanel } from "./ui/components/SynergyPanel";
import { clearDraggedItemId, clearDraggedUnitId } from "./ui/dragData";
import { useInterfaceFeedback } from "./ui/useInterfaceFeedback";
import { UnitStatsPanel } from "./ui/components/UnitStatsPanel";

function App() {
  const { game, moveUnit, rerollShop, buyUnit, buyExperience, equipItem, sellUnit, startCombat, tickCombat, advanceRound, resetGame } =
    useGameStore(
      useShallow((state) => ({
        game: state.game,
        moveUnit: state.moveUnit,
        rerollShop: state.rerollShop,
        buyUnit: state.buyUnit,
        buyExperience: state.buyExperience,
        equipItem: state.equipItem,
        sellUnit: state.sellUnit,
        startCombat: state.startCombat,
        tickCombat: state.tickCombat,
        advanceRound: state.advanceRound,
        resetGame: state.resetGame,
      })),
    );

  const player = getHumanPlayer(game);
  const opponent = getOpponentPlayer(game);
  const boardCells = getRenderBoard(game);
  const benchSlots = getHumanBench(game);
  const inventoryItemIds = getHumanItemInventory(game);
  const activeSynergies = getHumanActiveSynergies(game);
  const combatResult = getCombatResultSummary(game);
  const debugSnapshot = getDebugSnapshot(game);
  const latestLogEntry = game.log[0] ?? null;
  const [hoveredUnitId, setHoveredUnitId] = useState<string | null>(null);
  const [hoveredShopUnit, setHoveredShopUnit] = useState<RenderUnitState | null>(null);
  const [pinnedUnitId, setPinnedUnitId] = useState<string | null>(null);
  const [pinnedShopUnit, setPinnedShopUnit] = useState<RenderUnitState | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [draggedUnitId, setDraggedUnitId] = useState<string | null>(null);
  const closeInspectorTimeoutRef = useRef<number | null>(null);
  const hoveredUnits = useMemo(() => {
    const units = new Map<string, (typeof boardCells)[number]["unit"]>();

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
  const pinnedUnit = pinnedUnitId ? hoveredUnits.get(pinnedUnitId) ?? null : null;
  const isInspectorPinned = Boolean(pinnedUnitId || pinnedShopUnit);
  const inspectedUnit =
    pinnedUnit ??
    pinnedShopUnit ??
    (hoveredUnitId ? hoveredUnits.get(hoveredUnitId) ?? null : hoveredShopUnit);
  const hoveredUnitItems = inspectedUnit?.itemIds ?? [];
  const draggedUnit = draggedUnitId ? hoveredUnits.get(draggedUnitId) ?? null : null;
  const sellPreview = draggedUnit
    ? {
        unitName: draggedUnit.template.name,
        sellValue: getUnitSellValue(draggedUnit.template.cost, draggedUnit.starLevel),
      }
    : null;
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
  const { highlightedUnitIds, latestToast, goldDelta } = useInterfaceFeedback(
    boardCells,
    benchSlots,
    latestLogEntry,
    player.economy.gold,
    game.phase,
  );
  const isDev = import.meta.env.DEV;

  function cancelInspectorClose() {
    if (closeInspectorTimeoutRef.current !== null) {
      window.clearTimeout(closeInspectorTimeoutRef.current);
      closeInspectorTimeoutRef.current = null;
    }
  }

  function clearInspectorPreview() {
    setHoveredUnitId(null);
    setHoveredShopUnit(null);
  }

  function clearPinnedInspector() {
    setPinnedUnitId(null);
    setPinnedShopUnit(null);
  }

  function clearDragPreview() {
    clearDraggedUnitId();
    clearDraggedItemId();
    setDraggedUnitId(null);
  }

  function scheduleInspectorClose() {
    cancelInspectorClose();
    if (isInspectorPinned) {
      return;
    }

    closeInspectorTimeoutRef.current = window.setTimeout(() => {
      setHoveredUnitId(null);
      setHoveredShopUnit(null);
      closeInspectorTimeoutRef.current = null;
    }, 180);
  }

  useEffect(() => {
    if (!hoveredUnitId || hoveredUnits.has(hoveredUnitId)) {
      return;
    }

    setHoveredUnitId(null);
  }, [hoveredUnitId, hoveredUnits]);

  useEffect(() => {
    if (!draggedUnitId || hoveredUnits.has(draggedUnitId)) {
      return;
    }

    clearDragPreview();
  }, [draggedUnitId, hoveredUnits]);

  useEffect(() => {
    if (!pinnedUnitId || hoveredUnits.has(pinnedUnitId)) {
      return;
    }

    setPinnedUnitId(null);
  }, [hoveredUnits, pinnedUnitId]);

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
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      if (target.closest("[data-inspector-anchor='true']") || target.closest("[data-inspector-panel='true']")) {
        return;
      }

      cancelInspectorClose();
      clearPinnedInspector();
      clearInspectorPreview();
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    return () => {
      cancelInspectorClose();
    };
  }, []);

  useEffect(() => {
    const handleGlobalDragCleanup = () => {
      clearDragPreview();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        clearDragPreview();
      }
    };

    window.addEventListener("dragend", handleGlobalDragCleanup, true);
    window.addEventListener("drop", handleGlobalDragCleanup);
    window.addEventListener("blur", handleGlobalDragCleanup);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("dragend", handleGlobalDragCleanup, true);
      window.removeEventListener("drop", handleGlobalDragCleanup);
      window.removeEventListener("blur", handleGlobalDragCleanup);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

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

  return (
    <div className="h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(60,132,168,0.2),_transparent_26%),radial-gradient(circle_at_bottom,_rgba(247,201,72,0.06),_transparent_30%),linear-gradient(180deg,_#0a1322_0%,_#040811_100%)] text-slate-100">
      <div className="relative mx-auto grid h-full max-w-[1800px] grid-rows-[auto_minmax(0,1fr)] gap-1 p-1 lg:p-1.5 2xl:p-2">
        <HUD player={player} round={game.round} />

        <div className="grid min-h-0 gap-1 lg:grid-cols-[8rem_minmax(0,1fr)_10rem] xl:gap-1.25 xl:grid-cols-[8.5rem_minmax(0,1fr)_10.5rem] 2xl:grid-cols-[9rem_minmax(0,1fr)_11rem]">
          <aside className="relative z-30 flex min-h-0 min-w-0 flex-col gap-1.25 overflow-visible xl:gap-1.5">
            <SynergyPanel activeSynergies={activeSynergies} />
            <ItemInventoryPanel
              itemIds={inventoryItemIds}
              onSelectItem={(itemId) => {
                setSelectedItemId((current) => (current === itemId ? null : itemId));
              }}
              selectedItemId={selectedItemId}
            />
          </aside>

          <div className="relative z-10 grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_5.35rem_6.35rem] gap-1 lg:gap-1.1 xl:grid-rows-[minmax(0,1fr)_5.75rem_6.6rem] 2xl:grid-rows-[minmax(0,1fr)_6rem_6.9rem]">
            <div className="relative min-h-0">
              <Board
                board={game.board}
                cells={boardCells}
                highlightedUnitIds={highlightedUnitIds}
                onDropItemToUnit={(itemId, unitId) => {
                  equipItem(itemId, unitId);
                  setSelectedItemId(null);
                }}
                onDropUnit={(unitId, row, column) =>
                  moveUnit(unitId, {
                    type: "board",
                    row,
                    column,
                  })
                }
                onHoverUnit={(unitId) => {
                  if (isInspectorPinned) {
                    return;
                  }

                  if (unitId) {
                    cancelInspectorClose();
                    setHoveredShopUnit(null);
                    setHoveredUnitId(unitId);
                    return;
                  }

                  scheduleInspectorClose();
                }}
                onPinUnit={(unitId) => {
                  cancelInspectorClose();
                  setPinnedShopUnit(null);
                  setHoveredShopUnit(null);
                  setHoveredUnitId(unitId);
                  setPinnedUnitId((current) => (current === unitId ? null : unitId));
                }}
                onUnitDragStateChange={setDraggedUnitId}
                opponentLabel={opponent?.name ?? game.round.enemyLabel}
                phase={game.phase}
                selectedItemId={selectedItemId}
              />
              <FeedbackToast entry={latestToast} />
              <CombatResultOverlay
                isGameOver={game.phase === "gameOver"}
                onAdvance={advanceRound}
                onReset={resetGame}
                result={combatResult}
              />
            </div>

            <div className="min-h-0">
              <Bench
                highlightedUnitIds={highlightedUnitIds}
                onDropItemToUnit={(itemId, unitId) => {
                  equipItem(itemId, unitId);
                  setSelectedItemId(null);
                }}
                onDropUnit={(unitId, slotIndex) =>
                  moveUnit(unitId, {
                    type: "bench",
                    slotIndex,
                  })
                }
                onHoverUnit={(unitId) => {
                  if (isInspectorPinned) {
                    return;
                  }

                  if (unitId) {
                    cancelInspectorClose();
                    setHoveredShopUnit(null);
                    setHoveredUnitId(unitId);
                    return;
                  }

                  scheduleInspectorClose();
                }}
                onPinUnit={(unitId) => {
                  cancelInspectorClose();
                  setPinnedShopUnit(null);
                  setHoveredShopUnit(null);
                  setHoveredUnitId(unitId);
                  setPinnedUnitId((current) => (current === unitId ? null : unitId));
                }}
                onUnitDragStateChange={setDraggedUnitId}
                phase={game.phase}
                selectedItemId={selectedItemId}
                slots={benchSlots}
              />
            </div>

            <Shop
              currentXp={player.experience.currentXp}
              gold={player.economy.gold}
              goldDelta={goldDelta}
              level={player.experience.level}
              onAdvanceRound={advanceRound}
              onBuyExperience={buyExperience}
              onBuyUnit={buyUnit}
              onHoverUnit={(unit) => {
                if (isInspectorPinned) {
                  return;
                }

                if (unit) {
                  cancelInspectorClose();
                  setHoveredUnitId(null);
                  setHoveredShopUnit(unit);
                  return;
                }

                scheduleInspectorClose();
              }}
              onPinUnit={(unit) => {
                cancelInspectorClose();
                setPinnedUnitId(null);
                setHoveredUnitId(null);
                setHoveredShopUnit(unit);
                setPinnedShopUnit((current) => (current?.template.id === unit.template.id ? null : unit));
              }}
              onReroll={rerollShop}
              onReset={resetGame}
              onSellUnit={(unitId) => {
                sellUnit(unitId);
                clearDragPreview();
              }}
              onStartCombat={startCombat}
              phase={game.phase}
              sellPreview={sellPreview}
              shop={player.shop}
              xpToNext={player.experience.xpToNext}
            />
          </div>

          <aside className="relative z-30 flex min-h-0 min-w-0 flex-col gap-1.25 overflow-visible xl:gap-1.5">
            <LobbyHealthPanel players={lobbyPlayers} />
            <UnitStatsPanel
              className="flex-1"
              equippedItemIds={hoveredUnitItems}
              isPinned={isInspectorPinned}
              onClearPin={() => {
                clearPinnedInspector();
                clearInspectorPreview();
              }}
              onHoverChange={(isHovered) => {
                if (isHovered) {
                  cancelInspectorClose();
                  return;
                }

                scheduleInspectorClose();
              }}
              unit={inspectedUnit}
            />
          </aside>
        </div>

        {isDev && (
          <div className="pointer-events-none absolute bottom-2.5 left-2.5 z-30">
            <div className="pointer-events-auto">
              <DebugPanel snapshot={debugSnapshot} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
