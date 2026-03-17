import { useEffect, useRef, useState } from "react";
function collectVisibleUnits(boardCells, benchSlots) {
    const visibleUnits = new Map();
    for (const cell of boardCells) {
        if (!cell.unit) {
            continue;
        }
        visibleUnits.set(cell.unit.instanceId, {
            location: `board:${cell.side}:${cell.row}:${cell.column}`,
            starLevel: cell.unit.starLevel,
            itemKey: cell.unit.itemIds.join("|"),
        });
    }
    for (const slot of benchSlots) {
        if (!slot.unit) {
            continue;
        }
        visibleUnits.set(slot.unit.instanceId, {
            location: `bench:${slot.slotIndex}`,
            starLevel: slot.unit.starLevel,
            itemKey: slot.unit.itemIds.join("|"),
        });
    }
    return visibleUnits;
}
export function useInterfaceFeedback(boardCells, benchSlots, latestLogEntry, gold, phase) {
    const [highlightedUnitIds, setHighlightedUnitIds] = useState([]);
    const [latestToast, setLatestToast] = useState(null);
    const [goldDelta, setGoldDelta] = useState(null);
    const previousUnitsRef = useRef(null);
    const previousLogIdRef = useRef(null);
    const previousGoldRef = useRef(null);
    useEffect(() => {
        const nextUnits = collectVisibleUnits(boardCells, benchSlots);
        const previousUnits = previousUnitsRef.current;
        if (!previousUnits) {
            previousUnitsRef.current = nextUnits;
            return;
        }
        const changedUnitIds = [...nextUnits.entries()]
            .filter(([unitId, unitSignature]) => {
            const previousSignature = previousUnits.get(unitId);
            return (!previousSignature ||
                (phase === "prep" && previousSignature.location !== unitSignature.location) ||
                previousSignature.starLevel !== unitSignature.starLevel ||
                previousSignature.itemKey !== unitSignature.itemKey);
        })
            .map(([unitId]) => unitId);
        previousUnitsRef.current = nextUnits;
        if (changedUnitIds.length === 0) {
            return;
        }
        setHighlightedUnitIds(changedUnitIds);
        const timeout = window.setTimeout(() => {
            setHighlightedUnitIds([]);
        }, 950);
        return () => {
            window.clearTimeout(timeout);
        };
    }, [benchSlots, boardCells, phase]);
    useEffect(() => {
        if (!latestLogEntry || latestLogEntry.id === previousLogIdRef.current) {
            return;
        }
        previousLogIdRef.current = latestLogEntry.id;
        setLatestToast(latestLogEntry);
        const timeout = window.setTimeout(() => {
            setLatestToast(null);
        }, 1800);
        return () => {
            window.clearTimeout(timeout);
        };
    }, [latestLogEntry]);
    useEffect(() => {
        if (previousGoldRef.current === null) {
            previousGoldRef.current = gold;
            return;
        }
        const delta = gold - previousGoldRef.current;
        previousGoldRef.current = gold;
        if (delta === 0) {
            return;
        }
        setGoldDelta(delta);
        const timeout = window.setTimeout(() => {
            setGoldDelta(null);
        }, 900);
        return () => {
            window.clearTimeout(timeout);
        };
    }, [gold]);
    return {
        highlightedUnitIds,
        latestToast,
        goldDelta,
    };
}
