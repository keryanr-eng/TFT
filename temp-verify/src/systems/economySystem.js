"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateInterest = calculateInterest;
exports.getIncomeBreakdown = getIncomeBreakdown;
exports.calculateStreakBonus = calculateStreakBonus;
exports.getRoundIncome = getRoundIncome;
function calculateInterest(gold, cap = 5) {
    return Math.max(0, Math.min(Math.floor(gold / 10), cap));
}
function getIncomeBreakdown(gold, baseIncome = 5) {
    const interest = calculateInterest(gold);
    return {
        baseIncome,
        interest,
        total: baseIncome + interest,
    };
}
function calculateStreakBonus(winStreak, lossStreak) {
    const streak = Math.max(winStreak, lossStreak);
    if (streak >= 5) {
        return 3;
    }
    if (streak >= 4) {
        return 2;
    }
    if (streak >= 2) {
        return 1;
    }
    return 0;
}
function getRoundIncome(gold, winStreak, lossStreak, baseIncome = 5) {
    const interest = calculateInterest(gold);
    const streak = calculateStreakBonus(winStreak, lossStreak);
    return {
        baseIncome,
        interest,
        streak,
        total: baseIncome + interest + streak,
    };
}
