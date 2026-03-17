"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SynergyPanel = SynergyPanel;
const jsx_runtime_1 = require("react/jsx-runtime");
const synergyData_1 = require("../../data/synergyData");
const unitData_1 = require("../../data/unitData");
function SynergyPanel({ activeSynergies }) {
    const visibleSynergies = [...activeSynergies].sort((left, right) => {
        const leftTier = left.activeTier ?? 0;
        const rightTier = right.activeTier ?? 0;
        if (leftTier !== rightTier) {
            return rightTier - leftTier;
        }
        return right.count - left.count;
    });
    return ((0, jsx_runtime_1.jsxs)("section", { className: "relative overflow-visible rounded-[1.45rem] border border-black/10 bg-white/66 p-3 shadow-card backdrop-blur", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-2 flex items-center justify-between gap-2", children: [(0, jsx_runtime_1.jsx)("h2", { className: "font-display text-base text-ink", children: "Synergies" }), (0, jsx_runtime_1.jsx)("span", { className: "rounded-full bg-mint/24 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-lagoon", children: visibleSynergies.length })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-1.5", children: visibleSynergies.length > 0 ? (visibleSynergies.map((synergy) => {
                    const template = synergyData_1.synergyById[synergy.synergyId];
                    const unitNames = unitData_1.unitData
                        .filter((unit) => unit.familyId === synergy.synergyId || unit.traitIds.includes(synergy.synergyId))
                        .map((unit) => unit.name)
                        .sort((left, right) => left.localeCompare(right));
                    return ((0, jsx_runtime_1.jsxs)("div", { className: "group relative", children: [(0, jsx_runtime_1.jsx)("article", { className: "rounded-[0.95rem] border border-black/7 bg-white/78 px-2.5 py-2", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "grid h-8 w-8 shrink-0 place-items-center rounded-[0.8rem] text-[11px] font-display text-white", style: { backgroundColor: template?.ui.accentColor ?? "#3c84a8" }, children: template?.ui.iconText ?? "??" }), (0, jsx_runtime_1.jsxs)("div", { className: "min-w-0 flex-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-2", children: [(0, jsx_runtime_1.jsx)("p", { className: "truncate font-display text-[14px] leading-none text-ink", children: synergy.name }), (0, jsx_runtime_1.jsxs)("span", { className: "text-[10px] font-semibold text-ink/70", children: ["Actuel ", synergy.count] })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-[9px] uppercase tracking-[0.16em] text-ink/46", children: synergy.nextTier ? `prochain ${synergy.nextTier}` : "palier max" }), (0, jsx_runtime_1.jsx)("div", { className: "mt-2 flex flex-wrap gap-1", children: template?.breakpoints.map((breakpoint) => {
                                                        const isActive = synergy.count >= breakpoint.tier;
                                                        const isNext = !isActive && synergy.nextTier === breakpoint.tier;
                                                        return ((0, jsx_runtime_1.jsx)("span", { className: isActive
                                                                ? "rounded-full bg-lagoon px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white"
                                                                : isNext
                                                                    ? "rounded-full border border-lagoon/28 bg-lagoon/8 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-lagoon"
                                                                    : "rounded-full bg-ink/7 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-ink/42", children: breakpoint.tier }, `${synergy.synergyId}-${breakpoint.tier}`));
                                                    }) })] })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "pointer-events-none absolute left-full top-0 z-[140] ml-2 hidden w-64 rounded-[1rem] border border-black/12 bg-white px-3 py-3 text-left shadow-[0_22px_42px_rgba(31,37,48,0.24)] ring-1 ring-black/5 group-hover:block", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "grid h-9 w-9 shrink-0 place-items-center rounded-[0.9rem] text-[12px] font-display text-white", style: { backgroundColor: template?.ui.accentColor ?? "#3c84a8" }, children: template?.ui.iconText ?? "??" }), (0, jsx_runtime_1.jsxs)("div", { className: "min-w-0", children: [(0, jsx_runtime_1.jsx)("p", { className: "truncate font-display text-base text-ink", children: synergy.name }), (0, jsx_runtime_1.jsx)("p", { className: "mt-0.5 text-[10px] uppercase tracking-[0.16em] text-ink/46", children: template?.kind === "family" ? "Famille" : "Trait" })] })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-xs leading-relaxed text-ink/78", children: template?.gameplayIdentity || synergy.description || "Bonus de combat actif." }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-3", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/46", children: "Paliers" }), (0, jsx_runtime_1.jsx)("div", { className: "mt-2 space-y-1.5", children: template?.breakpoints.map((breakpoint) => {
                                                    const isActive = synergy.count >= breakpoint.tier;
                                                    return ((0, jsx_runtime_1.jsxs)("div", { className: isActive
                                                            ? "rounded-[0.8rem] border border-lagoon/18 bg-lagoon/8 px-2.5 py-2 text-[11px] text-lagoon"
                                                            : "rounded-[0.8rem] border border-black/8 bg-shell/90 px-2.5 py-2 text-[11px] text-ink/62", children: [(0, jsx_runtime_1.jsxs)("p", { className: "font-semibold uppercase tracking-[0.12em]", children: [isActive ? "[ACTIF]" : "[INACTIF]", " ", (0, jsx_runtime_1.jsxs)("span", { className: "font-display", children: ["(", breakpoint.tier, ")"] })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 leading-relaxed", children: breakpoint.description || "Effet a detailler." })] }, `${synergy.synergyId}-${breakpoint.tier}`));
                                                }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-3", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/46", children: "Unites" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-[11px] leading-relaxed text-ink/78", children: unitNames.length > 0 ? unitNames.join(", ") : "Aucune unite referencee." })] })] })] }, synergy.synergyId));
                })) : ((0, jsx_runtime_1.jsx)("div", { className: "rounded-[0.95rem] border border-dashed border-black/10 bg-white/56 px-3 py-3 text-[11px] text-ink/55", children: "Aucune synergie visible." })) })] }));
}
