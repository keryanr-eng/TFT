"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPreviewRenderUnit = createPreviewRenderUnit;
exports.getHumanPlayer = getHumanPlayer;
exports.getOpponentPlayer = getOpponentPlayer;
exports.getHumanBench = getHumanBench;
exports.getRenderBoard = getRenderBoard;
exports.getHumanActiveSynergies = getHumanActiveSynergies;
exports.getHumanItemInventory = getHumanItemInventory;
exports.getHumanBoardUnitCount = getHumanBoardUnitCount;
exports.getBotSummaries = getBotSummaries;
exports.getCombatEvents = getCombatEvents;
exports.getCombatResultSummary = getCombatResultSummary;
exports.getDebugSnapshot = getDebugSnapshot;
const unitData_1 = require("../data/unitData");
const itemSystem_1 = require("../systems/itemSystem");
function toRenderPersistentUnit(unit, side) {
    const template = unitData_1.unitById[unit.templateId];
    if (!template) {
        return null;
    }
    const { stats: resolvedStats, itemBonuses } = (0, itemSystem_1.buildResolvedStatsWithItems)(template, unit.starLevel, unit.items);
    return {
        instanceId: unit.id,
        template,
        starLevel: unit.starLevel,
        currentHealth: resolvedStats.maxHealth,
        currentMana: resolvedStats.startingMana,
        maxHealth: resolvedStats.maxHealth,
        maxMana: resolvedStats.maxMana,
        side,
        isAlive: true,
        stats: {
            maxHealth: resolvedStats.maxHealth,
            maxMana: resolvedStats.maxMana,
            startingMana: resolvedStats.startingMana,
            attackDamage: resolvedStats.attackDamage,
            abilityPower: resolvedStats.abilityPower,
            armor: resolvedStats.armor,
            magicResist: resolvedStats.magicResist,
            attackSpeed: resolvedStats.attackSpeed,
            critChance: resolvedStats.critChance,
            moveSpeed: resolvedStats.moveSpeed,
            range: resolvedStats.range,
        },
        itemBonuses,
        itemIds: unit.items,
    };
}
function createPreviewRenderUnit(template) {
    const baseStats = (0, itemSystem_1.buildBaseResolvedStats)(template, 1);
    const emptyItemBonuses = (0, itemSystem_1.createEmptyHoverStatsSnapshot)();
    return {
        instanceId: `preview-${template.id}`,
        template,
        starLevel: 1,
        currentHealth: baseStats.maxHealth,
        currentMana: 0,
        maxHealth: baseStats.maxHealth,
        maxMana: baseStats.maxMana,
        side: "home",
        isAlive: true,
        stats: {
            maxHealth: baseStats.maxHealth,
            maxMana: baseStats.maxMana,
            startingMana: 0,
            attackDamage: baseStats.attackDamage,
            abilityPower: baseStats.abilityPower,
            armor: baseStats.armor,
            magicResist: baseStats.magicResist,
            attackSpeed: baseStats.attackSpeed,
            critChance: baseStats.critChance,
            moveSpeed: baseStats.moveSpeed,
            range: baseStats.range,
        },
        itemBonuses: emptyItemBonuses,
        itemIds: [],
    };
}
function toRenderCombatUnit(unit) {
    const template = unitData_1.unitById[unit.templateId];
    if (!template) {
        return null;
    }
    return {
        instanceId: unit.id,
        template,
        starLevel: unit.starLevel,
        currentHealth: unit.health,
        currentMana: unit.mana,
        maxHealth: unit.stats.maxHealth,
        maxMana: unit.stats.maxMana,
        side: unit.side,
        isAlive: unit.alive,
        stats: {
            maxHealth: unit.stats.maxHealth,
            maxMana: unit.stats.maxMana,
            startingMana: unit.stats.startingMana,
            attackDamage: unit.stats.attackDamage,
            abilityPower: unit.stats.abilityPower,
            armor: unit.stats.armor,
            magicResist: unit.stats.magicResist,
            attackSpeed: Number(unit.stats.attackSpeed.toFixed(2)),
            critChance: Number(unit.stats.critChance.toFixed(2)),
            moveSpeed: Number(unit.stats.moveSpeed.toFixed(2)),
            range: unit.stats.range,
        },
        itemBonuses: (0, itemSystem_1.buildResolvedStatsWithItems)(template, unit.starLevel, unit.items).itemBonuses,
        itemIds: unit.items,
    };
}
function getHumanPlayer(game) {
    return game.players[game.humanPlayerId];
}
function getOpponentPlayer(game) {
    if (!game.matchup) {
        return null;
    }
    return game.players[game.matchup.awayPlayerId] ?? null;
}
function getHumanBench(game) {
    const player = getHumanPlayer(game);
    return player.bench.map((slot) => ({
        slotIndex: slot.slotIndex,
        unit: slot.unitInstanceId && game.unitsById[slot.unitInstanceId]
            ? toRenderPersistentUnit(game.unitsById[slot.unitInstanceId], "home")
            : null,
    }));
}
function buildPrepBoard(game, player, side) {
    return player.boardSlots.map((slot) => ({
        row: slot.row,
        column: slot.column,
        side,
        unit: slot.unitInstanceId && game.unitsById[slot.unitInstanceId]
            ? toRenderPersistentUnit(game.unitsById[slot.unitInstanceId], side)
            : null,
    }));
}
function buildCombatBoard(game) {
    if (!game.combat) {
        return [];
    }
    return game.combat.units.map((unit) => ({
        row: unit.side === "away" ? unit.position.row : unit.position.row - game.board.awayRows,
        column: unit.position.column,
        side: unit.side,
        unit: toRenderCombatUnit(unit),
    }));
}
function getRenderBoard(game) {
    if (game.phase === "combat" && game.combat) {
        return buildCombatBoard(game);
    }
    const home = buildPrepBoard(game, getHumanPlayer(game), "home");
    const awayPlayer = getOpponentPlayer(game);
    const away = awayPlayer ? buildPrepBoard(game, awayPlayer, "away") : [];
    return [...away, ...home];
}
function getHumanActiveSynergies(game) {
    return game.activeSynergiesByPlayer[game.humanPlayerId] ?? [];
}
function getHumanItemInventory(game) {
    return getHumanPlayer(game).itemInventory;
}
function getHumanBoardUnitCount(game) {
    return getHumanPlayer(game).boardSlots.filter((slot) => slot.unitInstanceId !== null).length;
}
function getBotSummaries(game) {
    return game.playerOrder
        .map((playerId) => game.players[playerId])
        .filter((player) => Boolean(player && player.kind === "bot"))
        .map((player) => ({
        id: player.id,
        name: player.name,
        health: player.health,
        level: player.experience.level,
        gold: player.economy.gold,
        identity: player.focusSynergyId ?? "flex",
    }));
}
function getCombatEvents(game) {
    return game.combat?.events.slice(-8) ?? [];
}
function getCombatResultSummary(game) {
    if (!game.combat || (game.phase !== "resolution" && game.phase !== "gameOver")) {
        return null;
    }
    if (game.phase === "gameOver") {
        if (game.winnerId === game.humanPlayerId) {
            return {
                outcome: "victory",
                title: "VICTOIRE FINALE",
                subtitle: "Le dernier adversaire tombe. La meute animale vous appartient.",
                damage: game.combat.damageToAway,
                roundLabel: game.round.stageLabel,
            };
        }
        return {
            outcome: "defeat",
            title: "DEFAITE FINALE",
            subtitle: "Votre troupe est eliminee. Une nouvelle tentative repartira au round 1.",
            damage: game.combat.damageToHome,
            roundLabel: game.round.stageLabel,
        };
    }
    if (game.combat.winner === "home") {
        const opponentName = game.matchup ? game.players[game.matchup.awayPlayerId]?.name ?? "l'adversaire" : "l'adversaire";
        return {
            outcome: "victory",
            title: "VICTOIRE",
            subtitle: game.combat.damageToAway > 0
                ? `Vous infligez ${game.combat.damageToAway} degats a ${opponentName}.`
                : "Combat remporte sans degats visibles sur la fiche adverse.",
            damage: game.combat.damageToAway,
            roundLabel: game.round.stageLabel,
        };
    }
    if (game.combat.winner === "away") {
        return {
            outcome: "defeat",
            title: "DEFAITE",
            subtitle: `Vous perdez ${game.combat.damageToHome} HP apres ce round.`,
            damage: game.combat.damageToHome,
            roundLabel: game.round.stageLabel,
        };
    }
    return {
        outcome: "draw",
        title: "EGALITE",
        subtitle: "Aucun camp ne prend l'avantage. Le round se termine sans vainqueur.",
        damage: 0,
        roundLabel: game.round.stageLabel,
    };
}
function getDebugSnapshot(game) {
    const combatUnits = game.combat?.units ?? [];
    const homeUnits = combatUnits.length > 0
        ? combatUnits.filter((unit) => unit.side === "home" && unit.alive).length
        : getHumanBoardUnitCount(game);
    const awayUnits = combatUnits.length > 0
        ? combatUnits.filter((unit) => unit.side === "away" && unit.alive).length
        : (getOpponentPlayer(game)?.boardSlots.filter((slot) => slot.unitInstanceId !== null).length ?? 0);
    return {
        phase: game.phase,
        roundLabel: game.round.stageLabel,
        combatElapsedMs: game.combat?.elapsedMs ?? 0,
        homeUnits,
        awayUnits,
        activeSynergies: getHumanActiveSynergies(game).filter((synergy) => synergy.activeTier !== null).map((synergy) => synergy.name),
    };
}
