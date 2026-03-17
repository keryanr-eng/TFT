const statAliases = [
    [/pv/i, "health", "percent"],
    [/ad/i, "attackDamage", "percent"],
    [/\bap\b/i, "abilityPower", "percent"],
    [/vitesse d'?attaque|as/i, "attackSpeed", "percent"],
    [/crit/i, "critChance", "percent"],
    [/mana initial/i, "startingMana", "flat"],
    [/armure/i, "armor", "flat"],
    [/resistance magique/i, "magicResist", "flat"],
    [/portee/i, "range", "flat"],
    [/vitesse de deplacement/i, "moveSpeed", "percent"],
];
export function toNumber(value, fallback = 0) {
    const normalized = value.replace(",", ".").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
}
export function parseTiers(value) {
    return value
        .split("/")
        .map((entry) => toNumber(entry, -1))
        .filter((entry) => entry > 0);
}
export function parsePriority(value) {
    const normalized = value.trim().toLowerCase();
    if (normalized.startsWith("haut")) {
        return "high";
    }
    if (normalized.startsWith("moy")) {
        return "medium";
    }
    return "low";
}
export function inferRole(roleLabel) {
    const normalized = roleLabel.toLowerCase();
    if (normalized.includes("tank")) {
        return "tank";
    }
    if (normalized.includes("assassin")) {
        return "assassin";
    }
    if (normalized.includes("support")) {
        return "support";
    }
    if (normalized.includes("caster")) {
        return "caster";
    }
    if (normalized.includes("bruiser")) {
        return "bruiser";
    }
    if (normalized.includes("mobile") || normalized.includes("kiting")) {
        return "marksman";
    }
    return "hybrid";
}
export function inferTargetingRule(label) {
    const normalized = label.toLowerCase();
    if (normalized.includes("focus")) {
        return "team-focus";
    }
    if (normalized.includes("moins de pv") || normalized.includes("plus faible")) {
        return "lowest-health";
    }
    if (normalized.includes("plus grand groupe")) {
        return "largest-cluster";
    }
    if (normalized.includes("plus de mana")) {
        return "highest-mana-backline";
    }
    if (normalized.includes("backline")) {
        return "nearest-backline";
    }
    if (normalized.includes("ligne frontale")) {
        return "frontline-cluster";
    }
    if (normalized.includes("plus proche")) {
        return "nearest";
    }
    return "custom";
}
export function parseStatModifiers(statLine) {
    const modifiers = [];
    for (const fragment of statLine.split("+").map((part) => part.trim()).filter(Boolean)) {
        const amountMatch = fragment.match(/(\d+(?:[.,]\d+)?)/);
        if (!amountMatch) {
            continue;
        }
        const value = Number(amountMatch[1].replace(",", "."));
        const match = statAliases.find(([pattern]) => pattern.test(fragment));
        if (!match) {
            continue;
        }
        const [, stat, baseMode] = match;
        const mode = fragment.includes("%") ? "percent" : baseMode;
        modifiers.push({
            stat,
            mode,
            value,
            sourceText: fragment,
        });
    }
    return modifiers;
}
export function pickAccentColor(seed) {
    const palette = ["#ff845c", "#6fd3c0", "#f7c948", "#3c84a8", "#ffb77a", "#73a942"];
    const hash = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return palette[hash % palette.length];
}
