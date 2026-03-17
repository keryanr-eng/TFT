"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGameStore = void 0;
const zustand_1 = require("zustand");
const gameManager_1 = require("../game/gameManager");
exports.useGameStore = (0, zustand_1.create)((set) => ({
    game: (0, gameManager_1.createNewGame)(),
    moveUnit: (unitId, destination) => set((state) => ({
        game: (0, gameManager_1.moveHumanUnit)(state.game, unitId, destination),
    })),
    rerollShop: () => set((state) => ({
        game: (0, gameManager_1.rerollHumanShop)(state.game),
    })),
    buyUnit: (slotIndex) => set((state) => ({
        game: (0, gameManager_1.buyHumanUnit)(state.game, slotIndex),
    })),
    buyExperience: () => set((state) => ({
        game: (0, gameManager_1.buyHumanExperience)(state.game),
    })),
    equipItem: (itemId, unitId) => set((state) => ({
        game: (0, gameManager_1.equipHumanItem)(state.game, itemId, unitId),
    })),
    startCombat: () => set((state) => ({
        game: (0, gameManager_1.startCombatPhase)(state.game),
    })),
    tickCombat: (deltaMs) => set((state) => ({
        game: (0, gameManager_1.tickCombatPhase)(state.game, deltaMs),
    })),
    advanceRound: () => set((state) => ({
        game: (0, gameManager_1.advanceAfterResolution)(state.game),
    })),
    resetGame: () => set(() => ({
        game: (0, gameManager_1.createNewGame)(),
    })),
}));
