import type {
  BenchSlotState,
  BoardCellState,
  BoardDefinition,
  PlacementDestination,
  PlayerState,
  UnitInstanceId,
} from "../types/gameTypes";

export function createBoardSlots(board: BoardDefinition): BoardCellState[] {
  return Array.from({ length: board.homeRows * board.columns }, (_, index) => ({
    row: Math.floor(index / board.columns),
    column: index % board.columns,
    unitInstanceId: null,
  }));
}

export function createBenchSlots(board: BoardDefinition): BenchSlotState[] {
  return Array.from({ length: board.benchSlots }, (_, slotIndex) => ({
    slotIndex,
    unitInstanceId: null,
  }));
}

export function findBoardCell(player: PlayerState, row: number, column: number): BoardCellState | null {
  return player.boardSlots.find((slot) => slot.row === row && slot.column === column) ?? null;
}

export function findBenchSlot(player: PlayerState, slotIndex: number): BenchSlotState | null {
  return player.bench.find((slot) => slot.slotIndex === slotIndex) ?? null;
}

export function findUnitBoardCell(player: PlayerState, unitId: UnitInstanceId): BoardCellState | null {
  return player.boardSlots.find((slot) => slot.unitInstanceId === unitId) ?? null;
}

export function findUnitBenchSlot(player: PlayerState, unitId: UnitInstanceId): BenchSlotState | null {
  return player.bench.find((slot) => slot.unitInstanceId === unitId) ?? null;
}

export function countBoardUnits(player: PlayerState): number {
  return player.boardSlots.filter((slot) => slot.unitInstanceId !== null).length;
}

export function listBoardUnitIds(player: PlayerState): UnitInstanceId[] {
  return player.boardSlots
    .map((slot) => slot.unitInstanceId)
    .filter((unitId): unitId is UnitInstanceId => unitId !== null);
}

export function listBenchUnitIds(player: PlayerState): UnitInstanceId[] {
  return player.bench
    .map((slot) => slot.unitInstanceId)
    .filter((unitId): unitId is UnitInstanceId => unitId !== null);
}

export function findFirstEmptyBenchSlot(player: PlayerState): BenchSlotState | null {
  return player.bench.find((slot) => slot.unitInstanceId === null) ?? null;
}

export function clearUnitPlacement(player: PlayerState, unitId: UnitInstanceId): void {
  const boardSlot = findUnitBoardCell(player, unitId);
  if (boardSlot) {
    boardSlot.unitInstanceId = null;
  }

  const benchSlot = findUnitBenchSlot(player, unitId);
  if (benchSlot) {
    benchSlot.unitInstanceId = null;
  }
}

export function addUnitToBench(
  player: PlayerState,
  unitId: UnitInstanceId,
  preferredSlotIndex?: number,
): boolean {
  if (preferredSlotIndex !== undefined) {
    const preferredSlot = findBenchSlot(player, preferredSlotIndex);
    if (preferredSlot && preferredSlot.unitInstanceId === null) {
      preferredSlot.unitInstanceId = unitId;
      return true;
    }
  }

  const emptySlot = findFirstEmptyBenchSlot(player);
  if (!emptySlot) {
    return false;
  }

  emptySlot.unitInstanceId = unitId;
  return true;
}

export function removeUnitFromRoster(player: PlayerState, unitId: UnitInstanceId): void {
  clearUnitPlacement(player, unitId);
  player.rosterUnitIds = player.rosterUnitIds.filter((entry) => entry !== unitId);
}

export function movePlayerUnit(
  player: PlayerState,
  unitId: UnitInstanceId,
  destination: PlacementDestination,
  maxUnits: number,
): boolean {
  const sourceBoard = findUnitBoardCell(player, unitId);
  const sourceBench = findUnitBenchSlot(player, unitId);
  if (!sourceBoard && !sourceBench) {
    return false;
  }

  if (destination.type === "board") {
    const targetCell = findBoardCell(player, destination.row, destination.column);
    if (!targetCell) {
      return false;
    }

    if (sourceBoard && sourceBoard.row === destination.row && sourceBoard.column === destination.column) {
      return true;
    }

    const boardCount = countBoardUnits(player);
    const targetUnitId = targetCell.unitInstanceId;

    if (sourceBench && targetUnitId === null && boardCount >= maxUnits) {
      return false;
    }

    if (sourceBoard) {
      sourceBoard.unitInstanceId = targetUnitId;
    }

    if (sourceBench) {
      sourceBench.unitInstanceId = targetUnitId;
    }

    targetCell.unitInstanceId = unitId;
    return true;
  }

  const targetBenchSlot = findBenchSlot(player, destination.slotIndex);
  if (!targetBenchSlot) {
    return false;
  }

  if (sourceBench && sourceBench.slotIndex === destination.slotIndex) {
    return true;
  }

  const targetUnitId = targetBenchSlot.unitInstanceId;

  if (sourceBoard) {
    sourceBoard.unitInstanceId = targetUnitId;
  }

  if (sourceBench) {
    sourceBench.unitInstanceId = targetUnitId;
  }

  targetBenchSlot.unitInstanceId = unitId;
  return true;
}

