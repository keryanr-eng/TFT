"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useItemInventory = useItemInventory;
const react_1 = require("react");
const itemData_1 = require("../data/itemData");
function createStarterInventory() {
    return itemData_1.itemComponents.slice(0, 5).map((item) => item.id);
}
function useItemInventory(unitIds, resetKey) {
    const [inventoryItemIds, setInventoryItemIds] = (0, react_1.useState)(() => createStarterInventory());
    const [equippedItemIdsByUnit, setEquippedItemIdsByUnit] = (0, react_1.useState)({});
    const [selectedItemId, setSelectedItemId] = (0, react_1.useState)(null);
    const previousResetKeyRef = (0, react_1.useRef)(resetKey);
    const unitIdSet = (0, react_1.useMemo)(() => new Set(unitIds), [unitIds]);
    const inventoryItemIdsRef = (0, react_1.useRef)(inventoryItemIds);
    const equippedItemIdsByUnitRef = (0, react_1.useRef)(equippedItemIdsByUnit);
    (0, react_1.useEffect)(() => {
        inventoryItemIdsRef.current = inventoryItemIds;
    }, [inventoryItemIds]);
    (0, react_1.useEffect)(() => {
        equippedItemIdsByUnitRef.current = equippedItemIdsByUnit;
    }, [equippedItemIdsByUnit]);
    (0, react_1.useEffect)(() => {
        if (resetKey >= previousResetKeyRef.current) {
            return;
        }
        previousResetKeyRef.current = resetKey;
        setInventoryItemIds(createStarterInventory());
        setEquippedItemIdsByUnit({});
        setSelectedItemId(null);
    }, [resetKey]);
    (0, react_1.useEffect)(() => {
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
