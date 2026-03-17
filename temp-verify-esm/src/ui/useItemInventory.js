import { useEffect, useMemo, useRef, useState } from "react";
import { itemComponents } from "../data/itemData";
function createStarterInventory() {
    return itemComponents.slice(0, 5).map((item) => item.id);
}
export function useItemInventory(unitIds, resetKey) {
    const [inventoryItemIds, setInventoryItemIds] = useState(() => createStarterInventory());
    const [equippedItemIdsByUnit, setEquippedItemIdsByUnit] = useState({});
    const [selectedItemId, setSelectedItemId] = useState(null);
    const previousResetKeyRef = useRef(resetKey);
    const unitIdSet = useMemo(() => new Set(unitIds), [unitIds]);
    const inventoryItemIdsRef = useRef(inventoryItemIds);
    const equippedItemIdsByUnitRef = useRef(equippedItemIdsByUnit);
    useEffect(() => {
        inventoryItemIdsRef.current = inventoryItemIds;
    }, [inventoryItemIds]);
    useEffect(() => {
        equippedItemIdsByUnitRef.current = equippedItemIdsByUnit;
    }, [equippedItemIdsByUnit]);
    useEffect(() => {
        if (resetKey >= previousResetKeyRef.current) {
            return;
        }
        previousResetKeyRef.current = resetKey;
        setInventoryItemIds(createStarterInventory());
        setEquippedItemIdsByUnit({});
        setSelectedItemId(null);
    }, [resetKey]);
    useEffect(() => {
        const removedEntries = Object.entries(equippedItemIdsByUnit).filter(([unitId]) => !unitIdSet.has(unitId));
        if (removedEntries.length === 0) {
            return;
        }
        const returnedItems = removedEntries.flatMap(([, itemIds]) => itemIds);
        setInventoryItemIds((current) => [...current, ...returnedItems]);
        setEquippedItemIdsByUnit((current) => Object.fromEntries(Object.entries(current).filter(([unitId]) => unitIdSet.has(unitId))));
        if (selectedItemId && !inventoryItemIdsRef.current.includes(selectedItemId)) {
            setSelectedItemId(null);
        }
    }, [equippedItemIdsByUnit, selectedItemId, unitIdSet]);
    function selectItem(itemId) {
        if (itemId === null) {
            setSelectedItemId(null);
            return;
        }
        if (!inventoryItemIdsRef.current.includes(itemId)) {
            return;
        }
        setSelectedItemId((current) => (current === itemId ? null : itemId));
    }
    function equipItemToUnit(itemId, unitId) {
        if (!unitIdSet.has(unitId)) {
            return false;
        }
        if (!inventoryItemIdsRef.current.includes(itemId)) {
            return false;
        }
        const existingItems = equippedItemIdsByUnitRef.current[unitId] ?? [];
        if (existingItems.length >= 3) {
            return false;
        }
        setInventoryItemIds((current) => {
            const index = current.indexOf(itemId);
            if (index === -1) {
                return current;
            }
            return current.filter((_, entryIndex) => entryIndex !== index);
        });
        setEquippedItemIdsByUnit((current) => {
            const currentItems = current[unitId] ?? [];
            return {
                ...current,
                [unitId]: [...currentItems, itemId],
            };
        });
        setSelectedItemId((current) => (current === itemId ? null : current));
        return true;
    }
    return {
        inventoryItemIds,
        equippedItemIdsByUnit,
        selectedItemId,
        selectItem,
        equipItemToUnit,
    };
}
