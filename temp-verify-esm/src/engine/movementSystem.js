function inBounds(row, column, board) {
    return row >= 0 && row < board.awayRows + board.homeRows && column >= 0 && column < board.columns;
}
function toSide(row, board) {
    return row < board.awayRows ? "away" : "home";
}
function keyFor(row, column) {
    return `${row}:${column}`;
}
function getDistance(row, column, target) {
    return Math.abs(row - target.position.row) + Math.abs(column - target.position.column);
}
function buildCandidates(source, target, occupied, board, reverse = false) {
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
export function buildMovementInstruction(unit, destination, occupied, board) {
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
export function buildRetreatInstruction(unit, threat, occupied, board) {
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
