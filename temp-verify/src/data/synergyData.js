"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.synergyById = exports.synergyData = void 0;
exports.summarizeSynergies = summarizeSynergies;
const synergies_v1_json_1 = __importDefault(require("./raw/synergies.v1.json"));
const parse_1 = require("../utils/parse");
const slugify_1 = require("../utils/slugify");
const synergyRows = synergies_v1_json_1.default;
exports.synergyData = synergyRows.map((row) => {
    const id = (0, slugify_1.slugify)(row.name);
    const kind = row.type.toLowerCase().includes("famille") ? "family" : "trait";
    const breakpoints = (0, parse_1.parseTiers)(row.tiers).map((tier, index) => {
        const effects = [row.tier1Effect, row.tier2Effect, row.tier3Effect];
        const description = effects[index] ?? "";
        return {
            tier,
            description,
            script: {
                key: `synergy.${id}.tier-${tier}`,
                description,
            },
        };
    });
    return {
        id,
        name: row.name,
        kind,
        gameplayIdentity: row.gameplayIdentity,
        isEnabled: row.status.trim().toLowerCase() === "v1",
        breakpoints,
        ui: {
            accentColor: (0, parse_1.pickAccentColor)(row.name),
            iconText: (0, slugify_1.initials)(row.name),
        },
    };
});
exports.synergyById = Object.fromEntries(exports.synergyData.map((synergy) => [synergy.id, synergy]));
function summarizeSynergies(units) {
    const counts = new Map();
    for (const unit of units) {
        counts.set(unit.familyId, (counts.get(unit.familyId) ?? 0) + 1);
        for (const traitId of unit.traitIds) {
            counts.set(traitId, (counts.get(traitId) ?? 0) + 1);
        }
    }
    return Array.from(counts.entries())
        .map(([synergyId, count]) => {
        const template = exports.synergyById[synergyId];
        if (!template) {
            return null;
        }
        const activeBreakpoint = [...template.breakpoints]
            .reverse()
            .find((breakpoint) => count >= breakpoint.tier);
        const nextBreakpoint = template.breakpoints.find((breakpoint) => count < breakpoint.tier);
        return {
            synergyId,
            name: template.name,
            kind: template.kind,
            count,
            activeTier: activeBreakpoint?.tier ?? null,
            nextTier: nextBreakpoint?.tier ?? null,
            description: activeBreakpoint?.description ?? nextBreakpoint?.description ?? "",
        };
    })
        .filter((entry) => Boolean(entry))
        .sort((left, right) => {
        const rightActive = right.activeTier ?? 0;
        const leftActive = left.activeTier ?? 0;
        if (rightActive !== leftActive) {
            return rightActive - leftActive;
        }
        return right.count - left.count;
    });
}
