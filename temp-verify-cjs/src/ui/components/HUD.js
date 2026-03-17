"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HUD = HUD;
const jsx_runtime_1 = require("react/jsx-runtime");
function HUD({ player, round }) {
    return ((0, jsx_runtime_1.jsxs)("section", { className: "flex items-center justify-between rounded-[1.2rem] border border-black/10 bg-white/60 px-3 py-2 shadow-sm backdrop-blur", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsxs)("span", { className: "rounded-full bg-coral/14 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-coral", children: ["HP ", player.health] }), (0, jsx_runtime_1.jsxs)("span", { className: "rounded-full bg-ink/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink", children: ["Round ", round.stageLabel] })] }), (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/42", children: round.kind })] }));
}
