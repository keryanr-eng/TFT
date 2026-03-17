import { PLAYER_LEVEL_CURVE } from "../data/progressionData";
import type { ExperienceState, PlayerState } from "../types/gameTypes";

export function getLevelProgression(level: number) {
  return PLAYER_LEVEL_CURVE.find((entry) => entry.level === level) ?? PLAYER_LEVEL_CURVE[0];
}

export function getMaxDeployableUnits(level: number): number {
  return getLevelProgression(level).maxUnits;
}

export function gainExperience(experience: ExperienceState, amount: number): ExperienceState {
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

export function canBuyExperience(player: PlayerState): boolean {
  return player.economy.gold >= player.shop.xpCost && player.experience.level < 10;
}

