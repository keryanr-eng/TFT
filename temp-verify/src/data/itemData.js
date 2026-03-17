"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemById = exports.itemRecipes = exports.itemComponents = void 0;
const items_v1_json_1 = __importDefault(require("./raw/items.v1.json"));
const parse_1 = require("../utils/parse");
const slugify_1 = require("../utils/slugify");
const itemRows = items_v1_json_1.default;
const componentMap = new Map();
for (const row of itemRows) {
    if (!row.component) {
        continue;
    }
    const id = (0, slugify_1.slugify)(row.component);
    if (componentMap.has(id)) {
        continue;
    }
    componentMap.set(id, {
        id,
        kind: "component",
        name: row.component,
        baseStat: row.baseStat,
        notes: row.notes,
        bonuses: (0, parse_1.parseStatModifiers)(row.baseStat),
    });
}
exports.itemComponents = Array.from(componentMap.values());
exports.itemRecipes = itemRows
    .filter((row) => row.item && row.component1 && row.component2)
    .map((row) => ({
    id: (0, slugify_1.slugify)(row.item),
    kind: "complete",
    name: row.item,
    recipe: [(0, slugify_1.slugify)(row.component1), (0, slugify_1.slugify)(row.component2)],
    statLine: row.stats,
    effectDescription: row.simpleEffect,
    priority: (0, parse_1.parsePriority)(row.priority),
    bonuses: (0, parse_1.parseStatModifiers)(row.stats),
}));
exports.itemById = Object.fromEntries([...exports.itemComponents, ...exports.itemRecipes].map((item) => [item.id, item]));
