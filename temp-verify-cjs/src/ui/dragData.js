"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDraggedUnitId = setDraggedUnitId;
exports.getDraggedUnitId = getDraggedUnitId;
exports.setDraggedItemId = setDraggedItemId;
exports.getDraggedItemId = getDraggedItemId;
exports.clearDraggedUnitId = clearDraggedUnitId;
exports.clearDraggedItemId = clearDraggedItemId;
const UNIT_DRAG_MIME = "application/x-animal-autochess-unit";
const ITEM_DRAG_MIME = "application/x-animal-autochess-item";
let activeDraggedUnitId = "";
let activeDraggedItemId = "";
function setDraggedUnitId(event, unitId) {
    event.dataTransfer.setData(UNIT_DRAG_MIME, unitId);
    event.dataTransfer.setData("text/plain", unitId);
    event.dataTransfer.effectAllowed = "move";
    activeDraggedUnitId = unitId;
    activeDraggedItemId = "";
}
function getDraggedUnitId(event) {
    if (Array.from(event.dataTransfer.types).includes(UNIT_DRAG_MIME)) {
        return event.dataTransfer.getData(UNIT_DRAG_MIME) || activeDraggedUnitId;
    }
    return activeDraggedUnitId;
}
function setDraggedItemId(event, itemId) {
    event.dataTransfer.setData(ITEM_DRAG_MIME, itemId);
    event.dataTransfer.setData("text/plain", itemId);
    event.dataTransfer.effectAllowed = "copy";
    activeDraggedItemId = itemId;
    activeDraggedUnitId = "";
}
function getDraggedItemId(event) {
    if (Array.from(event.dataTransfer.types).includes(ITEM_DRAG_MIME)) {
        return event.dataTransfer.getData(ITEM_DRAG_MIME) || activeDraggedItemId;
    }
    return activeDraggedItemId;
}
function clearDraggedUnitId() {
    activeDraggedUnitId = "";
}
function clearDraggedItemId() {
    activeDraggedItemId = "";
}
