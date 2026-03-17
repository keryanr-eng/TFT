"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoundSidebar = RoundSidebar;
const jsx_runtime_1 = require("react/jsx-runtime");
const clsx_1 = __importDefault(require("clsx"));
const phaseLabels = {
    bootstrap: "Chargement",
    prep: "Preparation",
    combat: "Combat",
    resolution: "Resultat",
    gameOver: "Fin de partie",
};
function RoundSidebar({ phase, round, opponentLabel, livingBots, players }) {
    return ((0, jsx_runtime_1.jsxs)("section", { className: "rounded-[1.45rem] border border-black/10 bg-white/66 p-3 shadow-card backdrop-blur", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "min-w-0", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[9px] font-semibold uppercase tracking-[0.2em] text-ink/40", children: "Round" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-1 truncate font-display text-lg leading-none text-ink", children: opponentLabel }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-[10px] uppercase tracking-[0.16em] text-ink/46", children: phaseLabels[phase] })] }), (0, jsx_runtime_1.jsx)("span", { className: "rounded-full bg-lagoon/15 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-lagoon", children: round.stageLabel })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-3 grid grid-cols-2 gap-2 text-[11px]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-[0.95rem] bg-shell/82 px-2.5 py-2", children: [(0, jsx_runtime_1.jsx)("p", { className: "uppercase tracking-[0.14em] text-ink/42", children: "Degats" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 font-display text-base text-ink", children: round.damageBase })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[0.95rem] bg-shell/82 px-2.5 py-2", children: [(0, jsx_runtime_1.jsx)("p", { className: "uppercase tracking-[0.14em] text-ink/42", children: "Bots" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 font-display text-base text-ink", children: livingBots })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-3", children: [(0, jsx_runtime_1.jsx)("p", { className: "mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-ink/40", children: "Lobby" }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-1", children: players.map((player) => ((0, jsx_runtime_1.jsxs)("div", { className: (0, clsx_1.default)("flex items-center justify-between rounded-[0.85rem] px-2.5 py-1.5 text-[10px]", player.isHuman ? "bg-lagoon/10" : "bg-white/62"), children: [(0, jsx_runtime_1.jsx)("span", { className: "truncate font-semibold text-ink/78", children: player.name }), (0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-1.5 font-display text-sm text-ink", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-coral", children: "\u2764" }), (0, jsx_runtime_1.jsx)("span", { className: (0, clsx_1.default)(player.health <= 0 && "text-ink/35 line-through"), children: player.health })] })] }, player.id))) })] })] }));
}
