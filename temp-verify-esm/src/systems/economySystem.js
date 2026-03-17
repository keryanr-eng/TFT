export function calculateInterest(gold, cap = 5) {
    return Math.max(0, Math.min(Math.floor(gold / 10), cap));
}
export function getIncomeBreakdown(gold, baseIncome = 5) {
    const interest = calculateInterest(gold);
    return {
        baseIncome,
        interest,
        total: baseIncome + interest,
    };
}
export function calculateStreakBonus(winStreak, lossStreak) {
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
export function getRoundIncome(gold, winStreak, lossStreak, baseIncome = 5) {
    const interest = calculateInterest(gold);
    const streak = calculateStreakBonus(winStreak, lossStreak);
    return {
        baseIncome,
        interest,
        streak,
        total: baseIncome + interest + streak,
    };
}
