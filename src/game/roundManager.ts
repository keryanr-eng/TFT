import { unitData, unitIdsByCost } from "../data/unitData";
import type {
  BoardDefinition,
  PlayerBoardPosition,
  PlayerId,
  RoundKind,
  RoundState,
  UnitId,
} from "../types/gameTypes";

export function inferRoundKind(index: number): RoundKind {
  if (index <= 3 || index % 5 === 0) {
    return index >= 10 ? "boss" : "pve";
  }

  return "pvp";
}

export function buildStageLabel(index: number): string {
  return `${Math.floor((index - 1) / 3) + 1}-${((index - 1) % 3) + 1}`;
}

export function createRoundState(index: number, opponentId: PlayerId, opponentLabel: string): RoundState {
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

function choosePool(cost: number, offset: number): UnitId {
  const bucket = Math.min(5, Math.max(1, cost)) as 1 | 2 | 3 | 4 | 5;
  const pool = unitIdsByCost[bucket];
  return pool[offset % pool.length] ?? unitData[offset % unitData.length]?.id ?? unitData[0].id;
}

function buildPveTemplateList(roundIndex: number): UnitId[] {
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

export function buildPveFormation(
  roundIndex: number,
  board: BoardDefinition,
): Array<{ templateId: UnitId; position: PlayerBoardPosition }> {
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

