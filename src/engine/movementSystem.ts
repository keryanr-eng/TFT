import type {
  BoardDefinition,
  BoardPosition,
  CombatUnitState,
  MovementInstruction,
} from "../types/gameTypes";

function inBounds(row: number, column: number, board: BoardDefinition): boolean {
  return row >= 0 && row < board.awayRows + board.homeRows && column >= 0 && column < board.columns;
}

function toSide(row: number, board: BoardDefinition): "home" | "away" {
  return row < board.awayRows ? "away" : "home";
}

function keyFor(row: number, column: number): string {
  return `${row}:${column}`;
}

function getDistance(
  row: number,
  column: number,
  target: CombatUnitState,
): number {
  return Math.abs(row - target.position.row) + Math.abs(column - target.position.column);
}

function buildCandidates(
  source: CombatUnitState,
  target: CombatUnitState,
  occupied: Set<string>,
  board: BoardDefinition,
  reverse = false,
): BoardPosition[] {
  const directions = [
    { row: source.position.row + 1, column: source.position.column },
    { row: source.position.row - 1, column: source.position.column },
    { row: source.position.row, column: source.position.column + 1 },
    { row: source.position.row, column: source.position.column - 1 },
  ];

  return directions
    .filter((candidate) => inBounds(candidate.row, candidate.column, board))
    .filter((candidate) => !occupied.has(keyFor(candidate.row, candidate.column)))
    .sort((left, right) => {
      const leftDistance = getDistance(left.row, left.column, target);
      const rightDistance = getDistance(right.row, right.column, target);
      return reverse ? rightDistance - leftDistance : leftDistance - rightDistance;
    })
    .map((candidate) => ({
      row: candidate.row,
      column: candidate.column,
      side: toSide(candidate.row, board),
    }));
}

export function buildMovementInstruction(
  unit: CombatUnitState,
  destination: CombatUnitState,
  occupied: Set<string>,
  board: BoardDefinition,
): MovementInstruction | null {
  const candidates = buildCandidates(unit, destination, occupied, board);
  const best = candidates[0];
  if (!best) {
    return null;
  }

  return {
    unitId: unit.id,
    from: unit.position,
    to: best,
    reason: "move-toward-target",
  };
}

export function buildRetreatInstruction(
  unit: CombatUnitState,
  threat: CombatUnitState,
  occupied: Set<string>,
  board: BoardDefinition,
): MovementInstruction | null {
  const candidates = buildCandidates(unit, threat, occupied, board, true);
  const best = candidates[0];
  if (!best) {
    return null;
  }

  return {
    unitId: unit.id,
    from: unit.position,
    to: best,
    reason: "retreat-from-threat",
  };
}
