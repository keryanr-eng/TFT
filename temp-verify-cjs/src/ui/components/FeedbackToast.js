"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackToast = FeedbackToast;
const jsx_runtime_1 = require("react/jsx-runtime");
const clsx_1 = __importDefault(require("clsx"));
function FeedbackToast({ entry }) {
    if (!entry) {
        return null;
    }
    const toneClass = entry.tone === "success"
        ? "border-mint/45 bg-mint/92 text-ink"
        : entry.tone === "warning"
            ? "border-coral/45 bg-coral/92 text-white"
            : entry.tone === "combat"
                ? "border-lagoon/45 bg-lagoon/92 text-white"
                : "border-black/10 bg-white/92 text-ink";
    return ((0, jsx_runtime_1.jsx)("div", { className: "pointer-events-none absolute inset-x-0 top-4 z-20 flex justify-center px-4", children: (0, jsx_runtime_1.jsx)("div", { className: (0, clsx_1.default)("result-pop rounded-full border px-4 py-2 text-sm font-semibold shadow-card backdrop-blur", toneClass), children: entry.text }) }));
}
