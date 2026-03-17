"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombatResultOverlay = CombatResultOverlay;
const jsx_runtime_1 = require("react/jsx-runtime");
const clsx_1 = __importDefault(require("clsx"));
function CombatResultOverlay({ result, isGameOver, onAdvance, onReset, }) {
    if (!result) {
        return null;
    }
    const accentClass = result.outcome === "victory"
        ? "border-mint/55 bg-mint/95 text-ink"
        : result.outcome === "defeat"
            ? "border-coral/55 bg-coral/95 text-white"
            : "border-sunflower/55 bg-sunflower/92 text-ink";
    return ((0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 z-20 grid place-items-center bg-ink/22 backdrop-blur-[2px]", children: (0, jsx_runtime_1.jsx)("div", { className: "result-pop pointer-events-auto w-full max-w-lg px-4", children: (0, jsx_runtime_1.jsxs)("article", { className: (0, clsx_1.default)("rounded-[2rem] border px-6 py-6 text-center shadow-card", accentClass), children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-xs font-semibold uppercase tracking-[0.28em] opacity-80", children: ["Round ", result.roundLabel] }), (0, jsx_runtime_1.jsx)("h3", { className: "mt-3 font-display text-5xl leading-none", children: result.title }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-base leading-relaxed opacity-90", children: result.subtitle }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-5 flex items-center justify-center gap-3", children: [(0, jsx_runtime_1.jsxs)("span", { className: "rounded-full bg-black/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]", children: ["Degats ", result.damage] }), (0, jsx_runtime_1.jsx)("span", { className: "rounded-full bg-black/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]", children: isGameOver ? "Partie terminee" : "Pret pour la suite" })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-6 flex justify-center gap-3", children: isGameOver ? ((0, jsx_runtime_1.jsx)("button", { className: "rounded-full bg-ink px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white", onClick: onReset, type: "button", children: "Nouvelle partie" })) : ((0, jsx_runtime_1.jsx)("button", { className: "rounded-full bg-ink px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white", onClick: onAdvance, type: "button", children: "Round suivant" })) })] }) }) }));
}
