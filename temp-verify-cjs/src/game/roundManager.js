"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferRoundKind = inferRoundKind;
exports.buildStageLabel = buildStageLabel;
exports.createRoundState = createRoundState;
exports.buildPveFormation = buildPveFormation;
const unitData_1 = require("../data/unitData");
function inferRoundKind(index) {
    if (index <= 3 || index % 5 === 0) {
        return index >= 10 ? "boss" : "pve";
    }
    return "pvp";
}
function buildStageLabel(index) {
    return `${Math.floor((index - 1) / 3) + 1}-${((index - 1) % 3) + 1}`;
}
function createRoundState(index, opponentId, opponentLabel) {
    const kind = inferRoundKind(index);
    return {
        index,
        stageLabel: buildStageLabel(index),
        kind,
        phaseTurn: 1,
        enemyLabel: opponentLabel,
        currentOpponentId: opponentId,
        rewardGold: kind === "pve" ? 4 : 5,
        damageBase: kind === "boss" ? 6 : kind === "pve" ? 2 : 3,
    };
}
function choosePool(cost, offset) {
    const bucket = Math.min(5, Math.max(1, cost));
    const pool = unitData_1.unitIdsByCost[bucket];
    return pool[offset % pool.length] ?? unitData_1.unitData[offset % unitData_1.unitData.length]?.id ?? unitData_1.unitData[0].id;
}
function buildPveTemplateList(roundIndex) {
    if (roundIndex === 1) {
        return [choosePool(1, 0), choosePool(1, 3)];
    }
    if (roundIndex === 2) {
        return [choosePool(1, 1), choosePool(1, 4), choosePool(1, 7)];
    }
    if (roundIndex === 3) {
        return [choosePool(1, 2), choosePool(1, 5), choosePool(2, 0), choosePool(2, 3)];
    }
    if (roundIndex % 10 === 0) {
        return [choosePool(5, roundIndex), choosePool(3, roundIndex + 1), choosePool(3, roundIndex + 2)];
    }
    return [
        choosePool(2, roundIndex),
        choosePool(2, roundIndex + 1),
        choosePool(3, roundIndex + 2),
        choosePool(3, roundIndex + 3),
    ];
}
function buildPveFormation(roundIndex, board) {
    const templates = buildPveTemplateList(roundIndex);
    const preferredColumns = [1, 3, 5, 2, 4];
    return templates.map((templateId, index) => ({
        templateId,
        position: {
            row: Math.min(board.homeRows - 1, Math.floor(index / 2)),
            column: preferredColumns[index] ?? index % board.columns,
        },
    }));
}
