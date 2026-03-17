import { PLAYER_LEVEL_CURVE } from "../data/progressionData";
export function getLevelProgression(level) {
    return PLAYER_LEVEL_CURVE.find((entry) => entry.level === level) ?? PLAYER_LEVEL_CURVE[0];
}
export function getMaxDeployableUnits(level) {
    return getLevelProgression(level).maxUnits;
}
export function gainExperience(experience, amount) {
    const next = {
        ...experience,
        currentXp: experience.currentXp + amount,
    };
    while (next.level < 10 && next.currentXp >= next.xpToNext) {
        next.currentXp -= next.xpToNext;
        next.level += 1;
        next.xpToNext = getLevelProgression(next.level).xpToNext;
    }
    return next;
}
export function canBuyExperience(player) {
    return player.economy.gold >= player.shop.xpCost && player.experience.level < 10;
}
