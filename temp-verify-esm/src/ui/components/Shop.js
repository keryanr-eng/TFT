import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import clsx from "clsx";
import { createPreviewRenderUnit } from "../../game/selectors";
import { unitById } from "../../data/unitData";
import { ShopUnit } from "./ShopUnit";
export function Shop({ shop, gold, level, currentXp, xpToNext, goldDelta, phase, onBuyUnit, onReroll, onBuyExperience, onHoverUnit, }) {
    const canInteract = phase === "prep";
    const xpRatio = xpToNext > 0 ? Math.max(0, Math.min(1, currentXp / xpToNext)) : 1;
    return (_jsxs("section", { className: "rounded-[1.45rem] border border-black/10 bg-white/76 p-3 shadow-card backdrop-blur", children: [_jsxs("div", { className: "mb-3 flex items-center justify-between gap-4", children: [_jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [_jsxs("div", { className: clsx("rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition", goldDelta === null
                                    ? "bg-sunflower/25 text-ink"
                                    : goldDelta < 0
                                        ? "bg-coral text-white"
                                        : "bg-mint text-ink"), children: ["Or ", gold, goldDelta !== null ? ` ${goldDelta > 0 ? `+${goldDelta}` : goldDelta}` : ""] }), _jsxs("div", { className: "rounded-full bg-lagoon/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-lagoon", children: ["Niv ", level] }), _jsxs("div", { className: "min-w-[8rem] rounded-full bg-ink/8 px-3 py-1.5", children: [_jsxs("div", { className: "flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/52", children: [_jsx("span", { children: "XP" }), _jsxs("span", { children: [currentXp, "/", xpToNext] })] }), _jsx("div", { className: "mt-1 h-1.5 overflow-hidden rounded-full bg-lagoon/12", children: _jsx("div", { className: "h-full rounded-full bg-lagoon", style: { width: `${xpRatio * 100}%` } }) })] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsxs("button", { className: "rounded-full bg-coral px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45", disabled: !canInteract || gold < shop.rerollCost, onClick: onReroll, type: "button", children: ["Reroll ", shop.rerollCost, "g"] }), _jsx("button", { className: "rounded-full bg-lagoon px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45", disabled: !canInteract || gold < shop.xpCost, onClick: onBuyExperience, type: "button", children: "Acheter XP" })] })] }), _jsx("div", { className: "grid grid-cols-5 gap-2", children: shop.offers.map((offer) => {
                    const template = unitById[offer.unitId];
                    if (!template) {
                        return null;
                    }
                    const canBuy = canInteract && gold >= offer.cost;
                    const previewUnit = createPreviewRenderUnit(template);
                    return (_jsx(ShopUnit, { cost: offer.cost, disabled: !canBuy, onHoverChange: (isHovered) => onHoverUnit(isHovered ? previewUnit : null), onBuy: () => onBuyUnit(offer.slotIndex), template: template }, `shop-${offer.slotIndex}`));
                }) })] }));
}
