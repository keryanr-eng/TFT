export function createBoardSlots(board) {
    return Array.from({ length: board.homeRows * board.columns }, (_, index) => ({
        row: Math.floor(index / board.columns),
        column: index % board.columns,
        unitInstanceId: null,
    }));
}
export function createBenchSlots(board) {
    return Array.from({ length: board.benchSlots }, (_, slotIndex) => ({
        slotIndex,
        unitInstanceId: null,
    }));
}
export function findBoardCell(player, row, column) {
    return player.boardSlots.find((slot) => slot.row === row && slot.column === column) ?? null;
}
export function findBenchSlot(player, slotIndex) {
    return player.bench.find((slot) => slot.slotIndex === slotIndex) ?? null;
}
export function findUnitBoardCell(player, unitId) {
    return player.boardSlots.find((slot) => slot.unitInstanceId === unitId) ?? null;
}
export function findUnitBenchSlot(player, unitId) {
    return player.bench.find((slot) => slot.unitInstanceId === unitId) ?? null;
}
export function countBoardUnits(player) {
    return player.boardSlots.filter((slot) => slot.unitInstanceId !== null).length;
}
export function listBoardUnitIds(player) {
    return player.boardSlots
        .map((slot) => slot.unitInstanceId)
        .filter((unitId) => unitId !== null);
}
export function listBenchUnitIds(player) {
    return player.bench
        .map((slot) => slot.unitInstanceId)
        .filter((unitId) => unitId !== null);
}
export function findFirstEmptyBenchSlot(player) {
    return player.bench.find((slot) => slot.unitInstanceId === null) ?? null;
}
export function clearUnitPlacement(player, unitId) {
    const boardSlot = findUnitBoardCell(player, unitId);
    if (boardSlot) {
        boardSlot.unitInstanceId = null;
    }
    const benchSlot = findUnitBenchSlot(player, unitId);
    if (benchSlot) {
        benchSlot.unitInstanceId = null;
    }
}
export function addUnitToBench(player, unitId, preferredSlotIndex) {
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
export function removeUnitFromRoster(player, unitId) {
    clearUnitPlacement(player, unitId);
    player.rosterUnitIds = player.rosterUnitIds.filter((entry) => entry !== unitId);
}
export function movePlayerUnit(player, unitId, destination, maxUnits) {
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
