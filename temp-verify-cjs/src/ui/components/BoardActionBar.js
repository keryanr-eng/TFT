"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoardActionBar = BoardActionBar;
const jsx_runtime_1 = require("react/jsx-runtime");
function BoardActionBar({ phase, onStartCombat, onAdvanceRound, onReset, }) {
    return ((0, jsx_runtime_1.jsxs)("section", { className: "flex items-center justify-center gap-2 rounded-[1.5rem] border border-black/8 bg-white/60 px-4 py-2.5 backdrop-blur", children: [(0, jsx_runtime_1.jsx)("button", { className: "rounded-full bg-lagoon px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45", disabled: phase !== "prep", onClick: onStartCombat, type: "button", children: "Lancer le combat" }), (0, jsx_runtime_1.jsx)("button", { className: "rounded-full bg-coral px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45", disabled: phase !== "resolution", onClick: onAdvanceRound, type: "button", children: "Round suivant" }), (0, jsx_runtime_1.jsx)("button", { className: "rounded-full bg-sunflower px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink transition hover:-translate-y-0.5", onClick: onReset, type: "button", children: "Nouvelle partie" })] }));
}
