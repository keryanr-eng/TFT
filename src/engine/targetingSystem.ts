import type { BoardDefinition, CombatUnitState, TargetingRequest } from "../types/gameTypes";

function getDistance(
  left: CombatUnitState,
  right: CombatUnitState,
): number {
  return Math.abs(left.position.row - right.position.row) + Math.abs(left.position.column - right.position.column);
}

function getLargestClusterScore(unit: CombatUnitState, enemies: CombatUnitState[]): number {
  return enemies.filter((enemy) => getDistance(unit, enemy) <= 1).length;
}

function getBacklinePriority(source: CombatUnitState, enemy: CombatUnitState): number {
  return source.side === "home" ? enemy.position.row : -enemy.position.row;
}

export function chooseTarget(request: TargetingRequest, board: BoardDefinition): CombatUnitState | null {
  const { enemies, allies, rule, source } = request;
  const livingEnemies = enemies.filter((enemy) => enemy.alive);

  if (livingEnemies.length === 0) {
    return null;
  }

  switch (rule) {
    case "lowest-health":
      return [...livingEnemies].sort((left, right) => left.health - right.health)[0] ?? null;
    case "team-focus": {
      const targetCounts = new Map<string, number>();
      for (const ally of allies) {
        if (!ally.targetId) {
          continue;
        }

        targetCounts.set(ally.targetId, (targetCounts.get(ally.targetId) ?? 0) + 1);
      }

      return [...livingEnemies].sort((left, right) => {
        const focusGap = (targetCounts.get(right.id) ?? 0) - (targetCounts.get(left.id) ?? 0);
        if (focusGap !== 0) {
          return focusGap;
        }

        return getDistance(source, left) - getDistance(source, right);
      })[0] ?? null;
    }
    case "largest-cluster":
      return [...livingEnemies].sort(
        (left, right) => getLargestClusterScore(right, livingEnemies) - getLargestClusterScore(left, livingEnemies),
      )[0] ?? null;
    case "highest-mana-backline":
      return [...livingEnemies].sort((left, right) => {
        const manaGap = right.mana - left.mana;
        if (manaGap !== 0) {
          return manaGap;
        }

        return getBacklinePriority(source, right) - getBacklinePriority(source, left);
      })[0] ?? null;
    case "nearest-backline":
      return [...livingEnemies].sort((left, right) => {
        const backlineGap = getBacklinePriority(source, right) - getBacklinePriority(source, left);
        if (backlineGap !== 0) {
          return backlineGap;
        }

        return getDistance(source, left) - getDistance(source, right);
      })[0] ?? null;
    case "frontline-cluster":
      return [...livingEnemies].sort((left, right) => {
        const leftFrontDistance = Math.abs(left.position.row - (source.side === "home" ? 0 : board.awayRows + board.homeRows - 1));
        const rightFrontDistance = Math.abs(right.position.row - (source.side === "home" ? 0 : board.awayRows + board.homeRows - 1));
        if (leftFrontDistance !== rightFrontDistance) {
          return leftFrontDistance - rightFrontDistance;
        }

        return getLargestClusterScore(right, livingEnemies) - getLargestClusterScore(left, livingEnemies);
      })[0] ?? null;
    case "nearest":
    case "custom":
    default:
      return [...livingEnemies].sort((left, right) => getDistance(source, left) - getDistance(source, right))[0] ?? null;
  }
}
