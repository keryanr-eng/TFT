import { create } from "zustand";
import { advanceAfterResolution, buyHumanExperience, buyHumanUnit, createNewGame, equipHumanItem, moveHumanUnit, rerollHumanShop, startCombatPhase, tickCombatPhase, } from "../game/gameManager";
export const useGameStore = create((set) => ({
    game: createNewGame(),
    moveUnit: (unitId, destination) => set((state) => ({
        game: moveHumanUnit(state.game, unitId, destination),
    })),
    rerollShop: () => set((state) => ({
        game: rerollHumanShop(state.game),
    })),
    buyUnit: (slotIndex) => set((state) => ({
        game: buyHumanUnit(state.game, slotIndex),
    })),
    buyExperience: () => set((state) => ({
        game: buyHumanExperience(state.game),
    })),
    equipItem: (itemId, unitId) => set((state) => ({
        game: equipHumanItem(state.game, itemId, unitId),
    })),
    startCombat: () => set((state) => ({
        game: startCombatPhase(state.game),
    })),
    tickCombat: (deltaMs) => set((state) => ({
        game: tickCombatPhase(state.game, deltaMs),
    })),
    advanceRound: () => set((state) => ({
        game: advanceAfterResolution(state.game),
    })),
    resetGame: () => set(() => ({
        game: createNewGame(),
    })),
}));
