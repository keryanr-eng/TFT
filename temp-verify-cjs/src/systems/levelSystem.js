"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLevelProgression = getLevelProgression;
exports.getMaxDeployableUnits = getMaxDeployableUnits;
exports.gainExperience = gainExperience;
exports.canBuyExperience = canBuyExperience;
const progressionData_1 = require("../data/progressionData");
function getLevelProgression(level) {
    return progressionData_1.PLAYER_LEVEL_CURVE.find((entry) => entry.level === level) ?? progressionData_1.PLAYER_LEVEL_CURVE[0];
}
function getMaxDeployableUnits(level) {
    return getLevelProgression(level).maxUnits;
}
function gainExperience(experience, amount) {
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
function canBuyExperience(player) {
    return player.economy.gold >= player.shop.xpCost && player.experience.level < 10;
}
