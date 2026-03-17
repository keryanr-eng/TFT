"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopUnit = ShopUnit;
const jsx_runtime_1 = require("react/jsx-runtime");
const clsx_1 = __importDefault(require("clsx"));
function ShopUnit({ template, cost, disabled = false, onBuy, onHoverChange }) {
    return ((0, jsx_runtime_1.jsxs)("button", { "aria-disabled": disabled, className: (0, clsx_1.default)("group flex min-h-[8.2rem] flex-col rounded-[1.2rem] border p-2.5 text-left transition", disabled
            ? "cursor-not-allowed border-black/6 bg-white/68 opacity-50"
            : "border-black/8 bg-white/92 hover:-translate-y-1 hover:border-lagoon/30 hover:shadow-card active:translate-y-0"), onMouseEnter: onHoverChange ? () => onHoverChange(true) : undefined, onMouseLeave: onHoverChange ? () => onHoverChange(false) : undefined, onClick: () => {
            if (disabled) {
                return;
            }
            onBuy();
        }, type: "button", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "relative", children: (0, jsx_runtime_1.jsx)("div", { className: "relative grid h-12 w-12 place-items-center rounded-[1rem] border border-black/10 text-[24px] text-white shadow-[0_8px_16px_rgba(31,37,48,0.12)]", style: { backgroundColor: template.ui.accentColor }, children: (0, jsx_runtime_1.jsx)("span", { className: "font-display", children: template.ui.iconText }) }) }), (0, jsx_runtime_1.jsxs)("span", { className: "rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white", children: [cost, "g"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-2 min-w-0", children: [(0, jsx_runtime_1.jsx)("p", { className: "truncate font-display text-[18px] leading-none text-ink", children: template.name }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-1 text-[10px] uppercase tracking-[0.18em] text-ink/45", children: [template.familyLabel, " / ", template.roleLabel] })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-2 flex flex-wrap gap-1", children: template.traitLabels.slice(0, 2).map((label) => ((0, jsx_runtime_1.jsx)("span", { className: "rounded-full bg-shell px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-ink/68", children: label }, `${template.id}-${label}`))) })] }));
}
