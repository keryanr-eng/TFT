"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unitIdsByCost = exports.unitById = exports.unitData = void 0;
const units_v1_json_1 = __importDefault(require("./raw/units.v1.json"));
const parse_1 = require("../utils/parse");
const slugify_1 = require("../utils/slugify");
const unitRows = units_v1_json_1.default;
const costHealthTable = {
    1: 700,
    2: 840,
    3: 980,
    4: 1180,
    5: 1420,
};
const costDamageTable = {
    1: 48,
    2: 58,
    3: 70,
    4: 84,
    5: 100,
};
function inferAbilityVisual(spellName, description) {
    const seed = `${spellName} ${description}`.toLowerCase();
    if (seed.includes("charge") || seed.includes("bondit")) {
        return "charge";
    }
    if (seed.includes("pluie") || seed.includes("zone") || seed.includes("vague")) {
        return "zone";
    }
    if (seed.includes("invoque") || seed.includes("eclore")) {
        return "summon";
    }
    if (seed.includes("bouclier") || seed.includes("vitesse")) {
        return "buff";
    }
    if (seed.includes("echo") || seed.includes("aboiement")) {
        return "pulse";
    }
    return "projectile";
}
function buildBaseStats(cost, roleArchetype, range) {
    const base = {
        maxHealth: costHealthTable[cost],
        attackDamage: costDamageTable[cost],
        abilityPower: 0,
        armor: 30,
        magicResist: 30,
        attackSpeed: 0.75,
        moveSpeed: 1,
        critChance: 0.05,
        manaGainPerAttack: 10,
    };
    switch (roleArchetype) {
        case "tank":
            return {
                ...base,
                maxHealth: Math.round(base.maxHealth * 1.22),
                attackDamage: Math.round(base.attackDamage * 0.88),
                armor: 42,
                magicResist: 42,
            };
        case "bruiser":
            return {
                ...base,
                maxHealth: Math.round(base.maxHealth * 1.12),
                attackDamage: Math.round(base.attackDamage * 1.06),
                armor: 36,
            };
        case "assassin":
            return {
                ...base,
                maxHealth: Math.round(base.maxHealth * 0.88),
                attackDamage: Math.round(base.attackDamage * 1.18),
                attackSpeed: 0.92,
                critChance: 0.18,
            };
        case "support":
            return {
                ...base,
                maxHealth: Math.round(base.maxHealth * 0.95),
                attackDamage: Math.round(base.attackDamage * 0.9),
                abilityPower: 24,
                attackSpeed: 0.8,
            };
        case "caster":
            return {
                ...base,
                maxHealth: Math.round(base.maxHealth * 0.92),
                attackDamage: Math.round(base.attackDamage * 0.86),
                abilityPower: 42,
                manaGainPerAttack: 12,
            };
        case "marksman":
            return {
                ...base,
                maxHealth: Math.round(base.maxHealth * 0.9),
                attackDamage: Math.round(base.attackDamage * 1.08),
                attackSpeed: 0.95,
            };
        default:
            return {
                ...base,
                moveSpeed: range > 1 ? 1.05 : 1,
            };
    }
}
exports.unitData = unitRows.map((row) => {
    const cost = Math.min(5, Math.max(1, (0, parse_1.toNumber)(row.cost, 1)));
    const range = Math.max(1, (0, parse_1.toNumber)(row.range, 1));
    const roleArchetype = (0, parse_1.inferRole)(row.role);
    const familyId = (0, slugify_1.slugify)(row.family);
    const traitLabels = [row.trait1, row.trait2].filter(Boolean);
    const id = (0, slugify_1.slugify)(row.unit);
    return {
        id,
        name: row.unit,
        cost,
        familyId,
        traitIds: traitLabels.map(slugify_1.slugify),
        familyLabel: row.family,
        traitLabels,
        roleLabel: row.role,
        roleArchetype,
        range,
        maxMana: (0, parse_1.toNumber)(row.maxMana, 60),
        targetingLabel: row.targeting,
        ability: {
            id: `${id}-ability`,
            name: row.spell,
            manaCost: (0, parse_1.toNumber)(row.maxMana, 60),
            targeting: (0, parse_1.inferTargetingRule)(row.targeting),
            description: row.shortDescription,
            script: {
                key: `unit.${id}.spell`,
                description: row.shortDescription,
            },
            visualStyle: inferAbilityVisual(row.spell, row.shortDescription),
        },
        baseStats: buildBaseStats(cost, roleArchetype, range),
        ui: {
            silhouetteKey: id,
            accentColor: (0, parse_1.pickAccentColor)(row.family),
            iconText: (0, slugify_1.initials)(row.unit),
        },
    };
});
exports.unitById = Object.fromEntries(exports.unitData.map((unit) => [unit.id, unit]));
exports.unitIdsByCost = exports.unitData.reduce((accumulator, unit) => {
    accumulator[unit.cost].push(unit.id);
    return accumulator;
}, { 1: [], 2: [], 3: [], 4: [], 5: [] });
