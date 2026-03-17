"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNewGame = createNewGame;
exports.moveHumanUnit = moveHumanUnit;
exports.rerollHumanShop = rerollHumanShop;
exports.buyHumanUnit = buyHumanUnit;
exports.buyHumanExperience = buyHumanExperience;
exports.equipHumanItem = equipHumanItem;
exports.startCombatPhase = startCombatPhase;
exports.tickCombatPhase = tickCombatPhase;
exports.advanceAfterResolution = advanceAfterResolution;
const unitData_1 = require("../data/unitData");
const combatEngine_1 = require("../engine/combatEngine");
const boardSystem_1 = require("../systems/boardSystem");
const levelSystem_1 = require("../systems/levelSystem");
const botAI_1 = require("./botAI");
const gameMutations_1 = require("./gameMutations");
const playerManager_1 = require("./playerManager");
const roundManager_1 = require("./roundManager");
const sessionFactory_1 = require("./sessionFactory");
const unitFactory_1 = require("./unitFactory");
const itemData_1 = require("../data/itemData");
function cloneGame(game) {
    return structuredClone(game);
}
function appendLog(game, tone, text) {
    game.log.unshift({
        id: `log-${game.round.index}-${game.log.length + 1}-${Math.round(Math.random() * 10000)}`,
        tone,
        text,
    });
    game.log = game.log.slice(0, 18);
}
function updateStreak(player, won) {
    if (player.kind === "neutral") {
        return;
    }
    if (won) {
        player.economy.winStreak += 1;
        player.economy.lossStreak = 0;
        return;
    }
    player.economy.lossStreak += 1;
    player.economy.winStreak = 0;
}
function getLivingBotIds(game) {
    return game.playerOrder.filter((playerId) => {
        if (playerId === game.humanPlayerId) {
            return false;
        }
        const player = game.players[playerId];
        return Boolean(player && player.kind === "bot" && !player.isEliminated && player.health > 0);
    });
}
function estimateArmyPower(game, playerId) {
    const player = game.players[playerId];
    if (!player) {
        return 0;
    }
    const unitPower = (0, boardSystem_1.listBoardUnitIds)(player).reduce((total, unitId) => {
        const unit = game.unitsById[unitId];
        const template = unit ? unitData_1.unitById[unit.templateId] : null;
        if (!unit || !template) {
            return total;
        }
        return total + template.cost * 12 + unit.starLevel * 18 + template.range * 2;
    }, 0);
    const synergyPower = (game.activeSynergiesByPlayer[playerId] ?? []).reduce((total, synergy) => total + (synergy.activeTier ?? 0) * 6 + synergy.count, 0);
    return unitPower + synergyPower;
}
function resolveOffscreenBotBattles(game, excludedIds) {
    const bots = getLivingBotIds(game).filter((playerId) => !excludedIds.has(playerId));
    for (let index = 0; index < bots.length; index += 2) {
        const homeId = bots[index];
        const awayId = bots[index + 1];
        if (!awayId) {
            break;
        }
        const home = game.players[homeId];
        const away = game.players[awayId];
        const homePower = estimateArmyPower(game, homeId) + Math.random() * 12;
        const awayPower = estimateArmyPower(game, awayId) + Math.random() * 12;
        const winner = homePower >= awayPower ? home : away;
        const loser = homePower >= awayPower ? away : home;
        const damage = 3 + Math.max(1, Math.floor(Math.abs(homePower - awayPower) / 35));
        (0, playerManager_1.applyDamageToPlayer)(loser, damage);
        updateStreak(winner, true);
        updateStreak(loser, false);
    }
}
function evaluateWinner(game) {
    const living = (0, playerManager_1.getLivingPlayerIds)(game);
    if (!living.includes(game.humanPlayerId)) {
        game.winnerId = living[0] ?? null;
        game.phase = "gameOver";
        return;
    }
    const remainingBots = getLivingBotIds(game);
    if (remainingBots.length === 0) {
        game.winnerId = game.humanPlayerId;
        game.phase = "gameOver";
    }
}
function chooseOpponentId(game, roundIndex) {
    const kind = (0, roundManager_1.inferRoundKind)(roundIndex);
    if (kind !== "pvp") {
        return game.neutralPlayerId;
    }
    const livingBots = getLivingBotIds(game);
    if (livingBots.length === 0) {
        return game.neutralPlayerId;
    }
    return livingBots[(roundIndex - 1) % livingBots.length] ?? livingBots[0];
}
function setupNeutralArmy(game, roundIndex) {
    const neutralId = game.neutralPlayerId;
    const neutral = game.players[neutralId];
    (0, gameMutations_1.clearPlayerArmy)(game, neutralId);
    neutral.shop.offers = [];
    neutral.focusSynergyId = null;
    neutral.economy.gold = 0;
    neutral.experience.level = Math.max(1, Math.min(9, Math.ceil(roundIndex / 2)));
    const formation = (0, roundManager_1.buildPveFormation)(roundIndex, game.board);
    for (const member of formation) {
        const unit = (0, unitFactory_1.spawnRosterUnit)(game, neutralId, member.templateId);
        const targetSlot = neutral.boardSlots.find((slot) => slot.row === member.position.row && slot.column === member.position.column);
        if (targetSlot) {
            targetSlot.unitInstanceId = unit.id;
        }
    }
    (0, gameMutations_1.recalculatePlayerSynergies)(game, neutralId);
}
function clearNeutralArmy(game) {
    (0, gameMutations_1.clearPlayerArmy)(game, game.neutralPlayerId);
}
function createMatchup(game, opponentId) {
    return {
        homePlayerId: game.humanPlayerId,
        awayPlayerId: opponentId,
        awayLabel: game.players[opponentId]?.name ?? "Adversaire",
        kind: (0, roundManager_1.inferRoundKind)(game.round.index),
    };
}
function prepareRound(game, initial) {
    if (!initial) {
        for (const playerId of game.playerOrder) {
            (0, gameMutations_1.awardPrepIncome)(game, playerId);
        }
    }
    const opponentId = chooseOpponentId(game, game.round.index);
    game.round = (0, roundManager_1.createRoundState)(game.round.index, opponentId, game.players[opponentId].name);
    game.matchup = createMatchup(game, opponentId);
    if (opponentId === game.neutralPlayerId) {
        setupNeutralArmy(game, game.round.index);
    }
    else {
        clearNeutralArmy(game);
    }
    for (const playerId of game.playerOrder) {
        const player = game.players[playerId];
        if (player.isEliminated) {
            continue;
        }
        (0, gameMutations_1.refreshPlayerShop)(game, playerId, false);
    }
    for (const botId of getLivingBotIds(game)) {
        (0, botAI_1.runBotPrepTurn)(game, botId);
    }
    (0, gameMutations_1.recalculateAllSynergies)(game);
    game.combat = null;
    game.phase = "prep";
    appendLog(game, "info", `Round ${game.round.stageLabel} - ${game.round.kind.toUpperCase()} contre ${game.players[opponentId].name}.`);
    evaluateWinner(game);
}
function resolveCombat(game) {
    const combat = game.combat;
    if (!combat || !game.matchup) {
        return;
    }
    const human = game.players[game.humanPlayerId];
    const opponent = game.players[game.matchup.awayPlayerId];
    if (combat.winner === "home") {
        updateStreak(human, true);
        if (opponent.kind === "bot") {
            (0, playerManager_1.applyDamageToPlayer)(opponent, combat.damageToAway);
            updateStreak(opponent, false);
        }
        appendLog(game, "success", `Victoire au round ${game.round.stageLabel}.`);
    }
    else if (combat.winner === "away") {
        (0, playerManager_1.applyDamageToPlayer)(human, combat.damageToHome);
        updateStreak(human, false);
        if (opponent.kind === "bot") {
            updateStreak(opponent, true);
        }
        appendLog(game, "warning", `Defaite au round ${game.round.stageLabel}, vous perdez ${combat.damageToHome} HP.`);
    }
    else {
        updateStreak(human, false);
        if (opponent.kind === "bot") {
            updateStreak(opponent, false);
        }
        appendLog(game, "warning", `Egalite au round ${game.round.stageLabel}.`);
    }
    resolveOffscreenBotBattles(game, new Set([game.matchup.awayPlayerId]));
    (0, gameMutations_1.recalculateAllSynergies)(game);
    evaluateWinner(game);
    if (game.phase !== "gameOver") {
        game.phase = "resolution";
    }
}
function createNewGame() {
    const game = (0, sessionFactory_1.createBaseGameState)();
    prepareRound(game, true);
    return game;
}
function moveHumanUnit(current, unitId, destination) {
    const next = cloneGame(current);
    if (next.phase !== "prep") {
        return next;
    }
    const human = next.players[next.humanPlayerId];
    const moved = (0, boardSystem_1.movePlayerUnit)(human, unitId, destination, (0, levelSystem_1.getMaxDeployableUnits)(human.experience.level));
    if (moved) {
        (0, gameMutations_1.recalculatePlayerSynergies)(next, next.humanPlayerId);
        const unit = next.unitsById[unitId];
        const name = unit ? unitData_1.unitById[unit.templateId]?.name ?? "Une unite" : "Une unite";
        appendLog(next, "info", destination.type === "board"
            ? `${name} est placee en ${destination.row + 1}-${destination.column + 1}.`
            : `${name} retourne sur le bench.`);
    }
    return next;
}
function rerollHumanShop(current) {
    const next = cloneGame(current);
    if (next.phase !== "prep") {
        return next;
    }
    const rerolled = (0, gameMutations_1.refreshPlayerShop)(next, next.humanPlayerId, true);
    if (rerolled) {
        appendLog(next, "info", `Shop relance. ${next.players[next.humanPlayerId].economy.gold}g restants.`);
    }
    return next;
}
function buyHumanUnit(current, slotIndex) {
    const next = cloneGame(current);
    if (next.phase !== "prep") {
        return next;
    }
    const offer = next.players[next.humanPlayerId].shop.offers.find((entry) => entry.slotIndex === slotIndex);
    const unitName = offer ? unitData_1.unitById[offer.unitId]?.name ?? "Une unite" : "Une unite";
    const purchased = (0, gameMutations_1.purchaseShopOffer)(next, next.humanPlayerId, slotIndex);
    if (purchased) {
        appendLog(next, "success", `${unitName} achetee. ${next.players[next.humanPlayerId].economy.gold}g restants.`);
    }
    return next;
}
function buyHumanExperience(current) {
    const next = cloneGame(current);
    if (next.phase !== "prep") {
        return next;
    }
    const bought = (0, gameMutations_1.buyExperienceForPlayer)(next, next.humanPlayerId);
    if (bought) {
        const human = next.players[next.humanPlayerId];
        appendLog(next, "info", `Experience achetee. Niveau ${human.experience.level}, ${human.economy.gold}g restants.`);
    }
    return next;
}
function equipHumanItem(current, itemId, unitId) {
    const next = cloneGame(current);
    if (next.phase !== "prep") {
        return next;
    }
    const itemName = itemData_1.itemById[itemId]?.name ?? "Un item";
    const unitName = next.unitsById[unitId] ? unitData_1.unitById[next.unitsById[unitId].templateId]?.name ?? "une unite" : "une unite";
    const equipped = (0, gameMutations_1.equipItemForPlayer)(next, next.humanPlayerId, unitId, itemId);
    if (!equipped) {
        return next;
    }
    if (equipped.combinations.length > 0) {
        const combination = equipped.combinations[equipped.combinations.length - 1];
        const resultName = itemData_1.itemById[combination.result]?.name ?? combination.result;
        appendLog(next, "success", `${unitName} combine ses composants et obtient ${resultName}.`);
        return next;
    }
    appendLog(next, "success", `${itemName} equipe sur ${unitName}.`);
    return next;
}
function startCombatPhase(current) {
    const next = cloneGame(current);
    if (next.phase !== "prep" || !next.matchup) {
        return next;
    }
    next.combat = (0, combatEngine_1.createCombatState)(next);
    next.phase = "combat";
    appendLog(next, "combat", `Le combat du round ${next.round.stageLabel} commence.`);
    return next;
}
function tickCombatPhase(current, deltaMs) {
    if (current.phase !== "combat" || !current.combat) {
        return current;
    }
    const next = cloneGame(current);
    next.combat = (0, combatEngine_1.stepCombat)(next.combat, deltaMs, next.board, next.activeSynergiesByPlayer);
    if (next.combat.isFinished) {
        resolveCombat(next);
    }
    return next;
}
function advanceAfterResolution(current) {
    const next = cloneGame(current);
    if (next.phase !== "resolution") {
        return next;
    }
    next.round.index += 1;
    prepareRound(next, false);
    return next;
}
