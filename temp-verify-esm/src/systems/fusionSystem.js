import { unitById } from "../data/unitData";
import { getMaxUnitItemSlots, resolveItemCombinations } from "./itemSystem";
import { findUnitBenchSlot, findUnitBoardCell, removeUnitFromRoster, } from "./boardSystem";
function getPlacementPriority(player, unitId) {
    const boardSlot = findUnitBoardCell(player, unitId);
    if (boardSlot) {
        return boardSlot.row * 10 + boardSlot.column;
    }
    const benchSlot = findUnitBenchSlot(player, unitId);
    if (benchSlot) {
        return 100 + benchSlot.slotIndex;
    }
    return 999;
}
function getNextStarLevel(starLevel) {
    if (starLevel === 1) {
        return 2;
    }
    return 3;
}
export function resolveAutomaticUpgrades(game, playerId) {
    const player = game.players[playerId];
    if (!player) {
        return;
    }
    let merged = true;
    while (merged) {
        merged = false;
        const groups = new Map();
        for (const unitId of player.rosterUnitIds) {
            const unit = game.unitsById[unitId];
            if (!unit || unit.starLevel >= 3) {
                continue;
            }
            const key = `${unit.templateId}:${unit.starLevel}`;
            const entries = groups.get(key) ?? [];
            entries.push(unitId);
            groups.set(key, entries);
        }
        for (const group of groups.values()) {
            if (group.length < 3) {
                continue;
            }
            const sorted = [...group].sort((left, right) => getPlacementPriority(player, left) - getPlacementPriority(player, right));
            const anchorId = sorted[0];
            const consumedIds = sorted.slice(1, 3);
            const anchor = game.unitsById[anchorId];
            if (!anchor) {
                continue;
            }
            const pooledItems = [anchor.items, ...consumedIds.map((consumedId) => game.unitsById[consumedId]?.items ?? [])].flat();
            const collapsedItems = resolveItemCombinations(pooledItems).items;
            anchor.items = collapsedItems.slice(0, getMaxUnitItemSlots());
            player.itemInventory.push(...collapsedItems.slice(getMaxUnitItemSlots()));
            anchor.starLevel = getNextStarLevel(anchor.starLevel);
            anchor.currentMana = 0;
            anchor.currentHealth = unitById[anchor.templateId]?.baseStats.maxHealth ?? anchor.currentHealth;
            for (const consumedId of consumedIds) {
                removeUnitFromRoster(player, consumedId);
                delete game.unitsById[consumedId];
            }
            game.log.unshift({
                id: `merge-${anchorId}-${anchor.starLevel}`,
                tone: "success",
                text: `${unitById[anchor.templateId]?.name ?? "Une unite"} passe ${anchor.starLevel} etoiles.`,
            });
            merged = true;
            break;
        }
    }
}
