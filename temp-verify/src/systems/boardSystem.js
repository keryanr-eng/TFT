"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBoardSlots = createBoardSlots;
exports.createBenchSlots = createBenchSlots;
exports.findBoardCell = findBoardCell;
exports.findBenchSlot = findBenchSlot;
exports.findUnitBoardCell = findUnitBoardCell;
exports.findUnitBenchSlot = findUnitBenchSlot;
exports.countBoardUnits = countBoardUnits;
exports.listBoardUnitIds = listBoardUnitIds;
exports.listBenchUnitIds = listBenchUnitIds;
exports.findFirstEmptyBenchSlot = findFirstEmptyBenchSlot;
exports.clearUnitPlacement = clearUnitPlacement;
exports.addUnitToBench = addUnitToBench;
exports.removeUnitFromRoster = removeUnitFromRoster;
exports.movePlayerUnit = movePlayerUnit;
function createBoardSlots(board) {
    return Array.from({ length: board.homeRows * board.columns }, (_, index) => ({
        row: Math.floor(index / board.columns),
        column: index % board.columns,
        unitInstanceId: null,
    }));
}
function createBenchSlots(board) {
    return Array.from({ length: board.benchSlots }, (_, slotIndex) => ({
        slotIndex,
        unitInstanceId: null,
    }));
}
function findBoardCell(player, row, column) {
    return player.boardSlots.find((slot) => slot.row === row && slot.column === column) ?? null;
}
function findBenchSlot(player, slotIndex) {
    return player.bench.find((slot) => slot.slotIndex === slotIndex) ?? null;
}
function findUnitBoardCell(player, unitId) {
    return player.boardSlots.find((slot) => slot.unitInstanceId === unitId) ?? null;
}
function findUnitBenchSlot(player, unitId) {
    return player.bench.find((slot) => slot.unitInstanceId === unitId) ?? null;
}
function countBoardUnits(player) {
    return player.boardSlots.filter((slot) => slot.unitInstanceId !== null).length;
}
function listBoardUnitIds(player) {
    return player.boardSlots
        .map((slot) => slot.unitInstanceId)
        .filter((unitId) => unitId !== null);
}
function listBenchUnitIds(player) {
    return player.bench
        .map((slot) => slot.unitInstanceId)
        .filter((unitId) => unitId !== null);
}
function findFirstEmptyBenchSlot(player) {
    return player.bench.find((slot) => slot.unitInstanceId === null) ?? null;
}
function clearUnitPlacement(player, unitId) {
    const boardSlot = findUnitBoardCell(player, unitId);
    if (boardSlot) {
        boardSlot.unitInstanceId = null;
    }
    const benchSlot = findUnitBenchSlot(player, unitId);
    if (benchSlot) {
        benchSlot.unitInstanceId = null;
    }
}
function addUnitToBench(player, unitId, preferredSlotIndex) {
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
function removeUnitFromRoster(player, unitId) {
    clearUnitPlacement(player, unitId);
    player.rosterUnitIds = player.rosterUnitIds.filter((entry) => entry !== unitId);
}
function movePlayerUnit(player, unitId, destination, maxUnits) {
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
