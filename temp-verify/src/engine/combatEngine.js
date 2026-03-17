"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCombatState = createCombatState;
exports.stepCombat = stepCombat;
const unitData_1 = require("../data/unitData");
const movementSystem_1 = require("./movementSystem");
const targetingSystem_1 = require("./targetingSystem");
const itemSystem_1 = require("../systems/itemSystem");
const synergySystem_1 = require("../systems/synergySystem");
const COMBAT_TIMEOUT_MS = 45000;
function pushEvent(combat, kind, description, sourceUnitId, targetUnitId) {
    combat.events.push({
        id: `combat-${combat.elapsedMs}-${combat.events.length + 1}`,
        kind,
        description,
        sourceUnitId,
        targetUnitId,
        timestampMs: combat.elapsedMs,
    });
    combat.events = combat.events.slice(-120);
}
function getBaseDamage(kind) {
    if (kind === "boss") {
        return 6;
    }
    if (kind === "pve") {
        return 2;
    }
    return 3;
}
function getAttackSpeedMultiplier(unit) {
    const slow = unit.statuses
        .filter((status) => status.kind === "slow" && status.remainingMs > 0)
        .reduce((total, status) => total + status.value, 0);
    const bonus = unit.statuses
        .filter((status) => status.kind === "attack-speed" && status.remainingMs > 0)
        .reduce((total, status) => total + status.value, 0);
    return Math.max(0.35, 1 + bonus - slow);
}
function getAttackCooldown(unit) {
    return 1000 / Math.max(0.35, unit.stats.attackSpeed * getAttackSpeedMultiplier(unit));
}
function getMoveCooldown(unit) {
    return 650 / Math.max(0.45, unit.stats.moveSpeed);
}
function getDistance(left, right) {
    return Math.abs(left.position.row - right.position.row) + Math.abs(left.position.column - right.position.column);
}
function isInRange(attacker, target) {
    return getDistance(attacker, target) <= attacker.stats.range;
}
function getOccupiedPositions(combat, excludeId) {
    return new Set(combat.units
        .filter((unit) => unit.alive && unit.id !== excludeId)
        .map((unit) => `${unit.position.row}:${unit.position.column}`));
}
function getAliveUnitsBySide(combat, side) {
    return combat.units.filter((unit) => unit.alive && unit.side === side);
}
function getPlayerSynergies(activeSynergiesByPlayer, playerId) {
    return activeSynergiesByPlayer[playerId] ?? [];
}
function addStatus(unit, kind, name, value, durationMs, sourceUnitId, tickRateMs) {
    unit.statuses.push({
        id: `${kind}-${unit.id}-${unit.statuses.length + 1}`,
        kind,
        name,
        value,
        durationMs,
        remainingMs: durationMs,
        stacks: 1,
        sourceUnitId,
        tickRateMs,
        tickTimerMs: tickRateMs ?? 0,
    });
    if (kind === "shield") {
        unit.shield += value;
    }
}
function healUnit(combat, unit, amount, sourceUnitId) {
    if (!unit.alive || amount <= 0) {
        return;
    }
    const nextHealth = Math.min(unit.stats.maxHealth, unit.health + amount);
    const restored = nextHealth - unit.health;
    if (restored <= 0) {
        return;
    }
    unit.health = nextHealth;
    pushEvent(combat, "heal", `${unit.displayName} recupere ${Math.round(restored)} PV.`, sourceUnitId, unit.id);
}
function getMitigationMultiplier(value) {
    if (value >= 0) {
        return 100 / (100 + value);
    }
    return 2 - 100 / (100 - value);
}
function applyDamage(combat, target, amount, damageType, sourceUnitId, board, activeSynergiesByPlayer) {
    if (!target.alive || amount <= 0) {
        return 0;
    }
    let damage = amount;
    if (damageType === "physical") {
        damage *= getMitigationMultiplier(target.stats.armor);
    }
    else if (damageType === "magic") {
        damage *= getMitigationMultiplier(target.stats.magicResist);
    }
    if (target.shield > 0) {
        const absorbed = Math.min(target.shield, damage);
        target.shield -= absorbed;
        damage -= absorbed;
    }
    const actualDamage = Math.max(0, damage);
    target.health -= actualDamage;
    target.mana = Math.min(target.stats.maxMana, target.mana + 6);
    if (target.health <= 0) {
        handleDeath(combat, target, sourceUnitId, board, activeSynergiesByPlayer);
    }
    return actualDamage;
}
function createSummon(combat, summoner, label, factor, board) {
    const template = unitData_1.unitById[summoner.templateId];
    if (!template) {
        return;
    }
    const occupied = getOccupiedPositions(combat);
    const candidates = [
        { row: summoner.position.row, column: summoner.position.column + 1 },
        { row: summoner.position.row, column: summoner.position.column - 1 },
        { row: summoner.position.row + (summoner.side === "home" ? -1 : 1), column: summoner.position.column },
        { row: summoner.position.row + (summoner.side === "home" ? 1 : -1), column: summoner.position.column },
    ].filter((position) => position.row >= 0 &&
        position.row < board.awayRows + board.homeRows &&
        position.column >= 0 &&
        position.column < board.columns &&
        !occupied.has(`${position.row}:${position.column}`));
    const spawnPosition = candidates[0];
    if (!spawnPosition) {
        return;
    }
    const summon = {
        id: `${summoner.id}-summon-${combat.elapsedMs}-${combat.units.length}`,
        instanceId: `${summoner.id}-summon-${combat.elapsedMs}-${combat.units.length}`,
        templateId: summoner.templateId,
        ownerId: summoner.ownerId,
        displayName: label,
        familyId: summoner.familyId,
        traitIds: [],
        side: spawnPosition.row < board.awayRows ? "away" : "home",
        starLevel: 1,
        position: {
            row: spawnPosition.row,
            column: spawnPosition.column,
            side: spawnPosition.row < board.awayRows ? "away" : "home",
        },
        stats: {
            maxHealth: Math.round(summoner.stats.maxHealth * factor),
            attackDamage: Math.round(summoner.stats.attackDamage * factor),
            abilityPower: 0,
            armor: Math.round(summoner.stats.armor * factor),
            magicResist: Math.round(summoner.stats.magicResist * factor),
            attackSpeed: Math.max(0.7, summoner.stats.attackSpeed),
            moveSpeed: Math.max(0.9, summoner.stats.moveSpeed),
            critChance: 0.05,
            manaGainPerAttack: 0,
            range: 1,
            maxMana: 999,
            startingMana: 0,
            critDamage: 1.35,
        },
        health: Math.round(summoner.stats.maxHealth * factor),
        mana: 0,
        shield: 0,
        alive: true,
        targetId: null,
        attackTimerMs: 100,
        moveTimerMs: 0,
        hasMovedSinceAttack: false,
        firstAttackDone: false,
        statuses: [],
        items: [],
        attacksMade: 0,
        kills: 0,
        castsMade: 0,
        isSummon: true,
        summonValue: 0,
        hasRevived: false,
    };
    combat.units.push(summon);
    pushEvent(combat, "spawn", `${label} rejoint le combat.`, summoner.id, summon.id);
}
function handleDeath(combat, unit, killerId, board, activeSynergiesByPlayer) {
    if (!unit.alive) {
        return;
    }
    const synergies = getPlayerSynergies(activeSynergiesByPlayer, unit.ownerId);
    const porcineTier = unit.familyId === "porcins" ? (0, synergySystem_1.getActiveSynergyTier)(synergies, "porcins") : 0;
    if (porcineTier >= 3 && !unit.hasRevived) {
        unit.hasRevived = true;
        unit.health = Math.round(unit.stats.maxHealth * 0.18);
        addStatus(unit, "shield", "Dernier souffle", Math.round(unit.stats.maxHealth * 0.08), 1500, killerId);
        pushEvent(combat, "status", `${unit.displayName} refuse de tomber tout de suite.`, unit.id);
        return;
    }
    unit.alive = false;
    unit.health = 0;
    unit.targetId = null;
    pushEvent(combat, "death", `${unit.displayName} est KO.`, killerId, unit.id);
    const reptileTier = unit.familyId === "reptiles" ? (0, synergySystem_1.getActiveSynergyTier)(synergies, "reptiles") : 0;
    if (reptileTier >= 3) {
        const enemies = combat.units.filter((enemy) => enemy.alive && enemy.side !== unit.side && getDistance(unit, enemy) <= 1);
        for (const enemy of enemies) {
            addStatus(enemy, "poison", "Explosion toxique", 16, 2500, unit.id, 500);
        }
    }
    const rodentTier = unit.familyId === "rongeurs" ? (0, synergySystem_1.getActiveSynergyTier)(synergies, "rongeurs") : 0;
    if (rodentTier >= 1) {
        const amount = rodentTier >= 2 ? 2 : 1;
        const factor = rodentTier >= 3 ? 0.45 : 0.32;
        for (let index = 0; index < amount; index += 1) {
            createSummon(combat, unit, "Rat", factor, board);
        }
    }
    const contagiousTier = unit.traitIds.includes("contagieux")
        ? (0, synergySystem_1.getActiveSynergyTier)(synergies, "contagieux")
        : 0;
    if (contagiousTier >= 2) {
        const nearbyEnemies = combat.units.filter((enemy) => enemy.alive && enemy.side !== unit.side && getDistance(unit, enemy) <= 2);
        for (const enemy of nearbyEnemies) {
            addStatus(enemy, "poison", "Infection", 12, 2500, unit.id, 500);
        }
    }
    const killer = combat.units.find((entry) => entry.id === killerId);
    if (killer) {
        killer.kills += 1;
    }
}
function getNearestAlly(combat, caster, includeSelf = false) {
    return combat.units
        .filter((unit) => unit.alive && unit.side === caster.side && (includeSelf || unit.id !== caster.id))
        .sort((left, right) => getDistance(caster, left) - getDistance(caster, right))[0] ?? null;
}
function applyFamilyStatBonuses(unit, synergies) {
    if (unit.familyId === "equides") {
        const tier = (0, synergySystem_1.getActiveSynergyTier)(synergies, "equides");
        if (tier >= 1) {
            unit.stats.moveSpeed *= 1.25;
        }
    }
    if (unit.familyId === "felins") {
        const tier = (0, synergySystem_1.getActiveSynergyTier)(synergies, "felins");
        if (tier >= 1) {
            unit.stats.critChance += 0.2;
        }
    }
    if (unit.familyId === "oiseaux") {
        const tier = (0, synergySystem_1.getActiveSynergyTier)(synergies, "oiseaux");
        if (tier >= 1) {
            unit.stats.range += 1;
        }
    }
    if (unit.familyId === "porcins") {
        const tier = (0, synergySystem_1.getActiveSynergyTier)(synergies, "porcins");
        if (tier >= 1) {
            unit.stats.maxHealth = Math.round(unit.stats.maxHealth * 1.15);
            unit.health = unit.stats.maxHealth;
        }
    }
}
function buildCombatUnit(game, persistentUnitId, row, column, side) {
    const persistent = game.unitsById[persistentUnitId];
    const template = persistent ? unitData_1.unitById[persistent.templateId] : null;
    if (!persistent || !template) {
        return null;
    }
    const { stats } = (0, itemSystem_1.buildResolvedStatsWithItems)(template, persistent.starLevel, persistent.items);
    const combatUnit = {
        id: persistent.id,
        instanceId: persistent.id,
        templateId: persistent.templateId,
        ownerId: persistent.ownerId,
        displayName: template.name,
        familyId: template.familyId,
        traitIds: template.traitIds,
        side,
        starLevel: persistent.starLevel,
        position: {
            row,
            column,
            side,
        },
        stats,
        health: stats.maxHealth,
        mana: stats.startingMana,
        shield: 0,
        alive: true,
        targetId: null,
        attackTimerMs: 250 + Math.random() * 120,
        moveTimerMs: 0,
        hasMovedSinceAttack: false,
        firstAttackDone: false,
        statuses: [],
        items: persistent.items,
        attacksMade: 0,
        kills: 0,
        castsMade: 0,
        isSummon: false,
        summonValue: template.cost,
        hasRevived: false,
    };
    applyFamilyStatBonuses(combatUnit, getPlayerSynergies(game.activeSynergiesByPlayer, persistent.ownerId));
    return combatUnit;
}
function buildPlayerArmy(game, playerId, side) {
    const player = game.players[playerId];
    if (!player) {
        return [];
    }
    return player.boardSlots
        .filter((slot) => slot.unitInstanceId !== null)
        .map((slot) => buildCombatUnit(game, slot.unitInstanceId, side === "away" ? slot.row : game.board.awayRows + slot.row, slot.column, side))
        .filter((unit) => Boolean(unit));
}
function applyStartOfCombatEffects(combat, board, activeSynergiesByPlayer) {
    for (const unit of combat.units) {
        const synergies = getPlayerSynergies(activeSynergiesByPlayer, unit.ownerId);
        if (unit.familyId === "aquatiques" && (0, synergySystem_1.getActiveSynergyTier)(synergies, "aquatiques") >= 3) {
            const enemies = combat.units.filter((enemy) => enemy.alive && enemy.side !== unit.side && getDistance(unit, enemy) <= 2);
            for (const enemy of enemies) {
                addStatus(enemy, "slow", "Vague initiale", 0.18, 2000, unit.id);
            }
        }
        if (unit.familyId === "equides" && (0, synergySystem_1.getActiveSynergyTier)(synergies, "equides") >= 3) {
            const enemies = combat.units.filter((enemy) => enemy.alive && enemy.side !== unit.side);
            const nearest = enemies.sort((left, right) => getDistance(unit, left) - getDistance(unit, right))[0];
            if (nearest) {
                const instruction = (0, movementSystem_1.buildMovementInstruction)(unit, nearest, getOccupiedPositions(combat, unit.id), board);
                if (instruction) {
                    unit.position = instruction.to;
                }
            }
        }
    }
}
function computePackBonus(attacker, target, allies, synergies) {
    if (attacker.familyId !== "canides") {
        return 1;
    }
    const tier = (0, synergySystem_1.getActiveSynergyTier)(synergies, "canides");
    if (tier === 0) {
        return 1;
    }
    const focusCount = allies.filter((ally) => ally.alive && ally.familyId === "canides" && ally.targetId === target.id).length;
    if (focusCount === 0) {
        return 1;
    }
    if (tier >= 2) {
        return 1.3;
    }
    return 1.15;
}
function performAttack(combat, attacker, target, board, activeSynergiesByPlayer) {
    const synergies = getPlayerSynergies(activeSynergiesByPlayer, attacker.ownerId);
    const allies = combat.units.filter((unit) => unit.alive && unit.side === attacker.side);
    const movedBeforeAttack = attacker.hasMovedSinceAttack;
    let damage = attacker.stats.attackDamage;
    damage *= computePackBonus(attacker, target, allies, synergies);
    if (attacker.familyId === "felins" &&
        (0, synergySystem_1.getActiveSynergyTier)(synergies, "felins") >= 3 &&
        target.health / target.stats.maxHealth <= 0.35) {
        damage *= 1.4;
    }
    if (Math.random() < attacker.stats.critChance) {
        damage *= attacker.stats.critDamage;
    }
    const dealt = applyDamage(combat, target, damage, "physical", attacker.id, board, activeSynergiesByPlayer);
    attacker.attacksMade += 1;
    attacker.mana = Math.min(attacker.stats.maxMana, attacker.mana + attacker.stats.manaGainPerAttack);
    attacker.attackTimerMs = getAttackCooldown(attacker);
    pushEvent(combat, "attack", `${attacker.displayName} frappe ${target.displayName} pour ${Math.round(dealt)}.`, attacker.id, target.id);
    if (attacker.familyId === "aquatiques" && (0, synergySystem_1.getActiveSynergyTier)(synergies, "aquatiques") >= 1) {
        addStatus(target, "slow", "Ralentissement marin", 0.2, 2000, attacker.id);
    }
    if (attacker.familyId === "arachnides" && !attacker.firstAttackDone) {
        const duration = (0, synergySystem_1.getActiveSynergyTier)(synergies, "arachnides") >= 2 ? 1000 : 700;
        addStatus(target, "stun", "Toile", 0, duration, attacker.id);
    }
    if (attacker.familyId === "equides" &&
        (0, synergySystem_1.getActiveSynergyTier)(synergies, "equides") >= 2 &&
        movedBeforeAttack) {
        addStatus(target, "stun", "Impact de charge", 0, 750, attacker.id);
    }
    if (attacker.familyId === "reptiles" && (0, synergySystem_1.getActiveSynergyTier)(synergies, "reptiles") >= 1) {
        addStatus(target, "poison", "Poison", 12, 3000, attacker.id, 500);
    }
    if (attacker.traitIds.includes("contagieux") && (0, synergySystem_1.getActiveSynergyTier)(synergies, "contagieux") >= 1) {
        addStatus(target, "poison", "Infection", 10, 2500, attacker.id, 500);
        if ((0, synergySystem_1.getActiveSynergyTier)(synergies, "contagieux") >= 3) {
            addStatus(target, "anti-heal", "Plaie infectee", 0.3, 2500, attacker.id);
        }
    }
    if (attacker.familyId === "canides" &&
        (0, synergySystem_1.getActiveSynergyTier)(synergies, "canides") >= 3 &&
        target.alive &&
        target.health / target.stats.maxHealth <= 0.2) {
        applyDamage(combat, target, target.health + 1, "true", attacker.id, board, activeSynergiesByPlayer);
    }
    const insectTier = attacker.familyId === "insectes" ? (0, synergySystem_1.getActiveSynergyTier)(synergies, "insectes") : 0;
    if (insectTier >= 1) {
        const triggerEvery = insectTier >= 2 ? 4 : 5;
        if (attacker.attacksMade % triggerEvery === 0) {
            createSummon(combat, attacker, "Mini-insecte", insectTier >= 3 ? 0.55 : 0.38, board);
        }
    }
    attacker.firstAttackDone = true;
    attacker.hasMovedSinceAttack = false;
    if (!target.alive && attacker.familyId === "felins" && (0, synergySystem_1.getActiveSynergyTier)(synergies, "felins") >= 2) {
        attacker.attackTimerMs = 0;
        attacker.targetId = null;
    }
}
function castAbility(combat, caster, board, activeSynergiesByPlayer) {
    const template = unitData_1.unitById[caster.templateId];
    if (!template) {
        return;
    }
    const allies = combat.units.filter((unit) => unit.alive && unit.side === caster.side);
    const enemies = combat.units.filter((unit) => unit.alive && unit.side !== caster.side);
    const target = (0, targetingSystem_1.chooseTarget)({
        source: caster,
        allies,
        enemies,
        rule: template.ability.targeting,
    }, board) ?? enemies[0];
    const spellDamage = caster.stats.attackDamage * 0.8 + caster.stats.abilityPower * 1.35 + caster.starLevel * 28;
    const description = template.ability.description.toLowerCase();
    pushEvent(combat, "cast", `${caster.displayName} lance ${template.ability.name}.`, caster.id, target?.id);
    switch (template.ability.visualStyle) {
        case "buff": {
            const ally = getNearestAlly(combat, caster, true);
            if (description.includes("bouclier")) {
                addStatus(caster, "shield", "Bouclier", Math.round(caster.stats.maxHealth * 0.22), 3000, caster.id);
            }
            if (ally) {
                if (description.includes("mana")) {
                    ally.mana = Math.min(ally.stats.maxMana, ally.mana + 35);
                }
                addStatus(ally, "attack-speed", "Boost", 0.25, 3000, caster.id);
            }
            break;
        }
        case "pulse": {
            const ally = getNearestAlly(combat, caster);
            if (ally && description.includes("mana")) {
                ally.mana = Math.min(ally.stats.maxMana, ally.mana + 30);
                addStatus(ally, "attack-speed", "Tempo", 0.3, 3000, caster.id);
            }
            else if (target) {
                const splashTargets = enemies.filter((enemy) => getDistance(enemy, target) <= 1);
                for (const splashTarget of splashTargets) {
                    applyDamage(combat, splashTarget, spellDamage * 0.7, "magic", caster.id, board, activeSynergiesByPlayer);
                    addStatus(splashTarget, "slow", "Onde", 0.15, 1500, caster.id);
                }
            }
            break;
        }
        case "charge": {
            if (target) {
                const instruction = (0, movementSystem_1.buildMovementInstruction)(caster, target, getOccupiedPositions(combat, caster.id), board);
                if (instruction) {
                    caster.position = instruction.to;
                    caster.side = instruction.to.side;
                }
                applyDamage(combat, target, spellDamage * 1.1, "physical", caster.id, board, activeSynergiesByPlayer);
                addStatus(target, "stun", "Charge", 0, 900, caster.id);
            }
            break;
        }
        case "zone": {
            if (target) {
                const targets = enemies.filter((enemy) => getDistance(enemy, target) <= 1);
                for (const zoneTarget of targets) {
                    applyDamage(combat, zoneTarget, spellDamage, "magic", caster.id, board, activeSynergiesByPlayer);
                    if (description.includes("ralent")) {
                        addStatus(zoneTarget, "slow", "Zone collante", 0.18, 2000, caster.id);
                    }
                    if (description.includes("poison") || description.includes("infection")) {
                        addStatus(zoneTarget, "poison", "Nuage toxique", 14, 2500, caster.id, 500);
                    }
                    if (description.includes("repousse")) {
                        addStatus(zoneTarget, "stun", "Vague", 0, 400, caster.id);
                    }
                }
            }
            break;
        }
        case "summon": {
            if (target) {
                applyDamage(combat, target, spellDamage * 0.75, "magic", caster.id, board, activeSynergiesByPlayer);
            }
            createSummon(combat, caster, "Invocation", 0.42, board);
            break;
        }
        case "projectile":
        default: {
            if (target) {
                applyDamage(combat, target, spellDamage, "magic", caster.id, board, activeSynergiesByPlayer);
                if (description.includes("immobil") ||
                    description.includes("etourdit") ||
                    description.includes("renverse") ||
                    description.includes("repousse")) {
                    addStatus(target, "stun", "Impact", 0, 650, caster.id);
                }
                if (description.includes("repositionne") || description.includes("se repositionne")) {
                    const instruction = (0, movementSystem_1.buildRetreatInstruction)(caster, target, getOccupiedPositions(combat, caster.id), board);
                    if (instruction) {
                        caster.position = instruction.to;
                        caster.side = instruction.to.side;
                    }
                }
            }
            break;
        }
    }
    const casterSynergies = getPlayerSynergies(activeSynergiesByPlayer, caster.ownerId);
    if (caster.familyId === "aquatiques" && (0, synergySystem_1.getActiveSynergyTier)(casterSynergies, "aquatiques") >= 2 && target) {
        addStatus(target, "stun", "Remous", 0, 350, caster.id);
    }
    caster.mana = 0;
    caster.castsMade += 1;
    caster.attackTimerMs = Math.max(caster.attackTimerMs, 350);
}
function tickStatuses(combat, deltaMs, board, activeSynergiesByPlayer) {
    for (const unit of combat.units) {
        if (!unit.alive) {
            continue;
        }
        const synergies = getPlayerSynergies(activeSynergiesByPlayer, unit.ownerId);
        if (unit.familyId === "porcins" &&
            (0, synergySystem_1.getActiveSynergyTier)(synergies, "porcins") >= 2 &&
            unit.health / unit.stats.maxHealth <= 0.5) {
            healUnit(combat, unit, unit.stats.maxHealth * 0.02 * (deltaMs / 1000), unit.id);
        }
        for (const status of unit.statuses) {
            status.remainingMs -= deltaMs;
            if (status.tickRateMs && status.tickTimerMs !== undefined) {
                status.tickTimerMs -= deltaMs;
                while (status.tickTimerMs <= 0) {
                    status.tickTimerMs += status.tickRateMs;
                    if (status.kind === "poison") {
                        applyDamage(combat, unit, status.value, "magic", status.sourceUnitId, board, activeSynergiesByPlayer);
                    }
                    if (status.kind === "regen") {
                        healUnit(combat, unit, status.value, status.sourceUnitId);
                    }
                }
            }
        }
        unit.statuses = unit.statuses.filter((status) => status.remainingMs > 0);
    }
}
function maybeRetreatBird(combat, unit, target, board, activeSynergiesByPlayer) {
    const synergies = getPlayerSynergies(activeSynergiesByPlayer, unit.ownerId);
    if (unit.familyId !== "oiseaux" || (0, synergySystem_1.getActiveSynergyTier)(synergies, "oiseaux") < 2) {
        return false;
    }
    if (getDistance(unit, target) > 1 || unit.moveTimerMs > 0) {
        return false;
    }
    const retreat = (0, movementSystem_1.buildRetreatInstruction)(unit, target, getOccupiedPositions(combat, unit.id), board);
    if (!retreat) {
        return false;
    }
    unit.position = retreat.to;
    unit.side = retreat.to.side;
    unit.moveTimerMs = getMoveCooldown(unit);
    unit.hasMovedSinceAttack = true;
    pushEvent(combat, "move", `${unit.displayName} recule.`, unit.id);
    if ((0, synergySystem_1.getActiveSynergyTier)(synergies, "oiseaux") >= 3) {
        addStatus(unit, "attack-speed", "Kiting", 0.3, 3000, unit.id);
    }
    return true;
}
function finalizeCombat(combat) {
    const aliveHome = getAliveUnitsBySide(combat, "home");
    const aliveAway = getAliveUnitsBySide(combat, "away");
    if (aliveHome.length === 0 && aliveAway.length === 0) {
        combat.winner = "draw";
    }
    else if (aliveAway.length === 0) {
        combat.winner = "home";
    }
    else if (aliveHome.length === 0) {
        combat.winner = "away";
    }
    else {
        const homeHealth = aliveHome.reduce((sum, unit) => sum + unit.health, 0);
        const awayHealth = aliveAway.reduce((sum, unit) => sum + unit.health, 0);
        if (homeHealth === awayHealth) {
            combat.winner = "draw";
        }
        else {
            combat.winner = homeHealth > awayHealth ? "home" : "away";
        }
    }
    const baseDamage = getBaseDamage(combat.matchup.kind);
    const survivingValue = (side) => combat.units
        .filter((unit) => unit.alive && unit.side === side && !unit.isSummon)
        .reduce((sum, unit) => sum + unit.summonValue + unit.starLevel - 1, 0);
    combat.damageToHome = combat.winner === "away" ? baseDamage + survivingValue("away") : 0;
    combat.damageToAway = combat.winner === "home" ? baseDamage + survivingValue("home") : 0;
    combat.isFinished = true;
    pushEvent(combat, "round-end", `Combat termine: ${combat.winner}.`);
}
function createCombatState(game) {
    const matchup = game.matchup;
    const combat = {
        elapsedMs: 0,
        winner: "pending",
        events: [],
        isFinished: false,
        units: [
            ...buildPlayerArmy(game, matchup.homePlayerId, "home"),
            ...buildPlayerArmy(game, matchup.awayPlayerId, "away"),
        ],
        matchup,
        damageToHome: 0,
        damageToAway: 0,
    };
    applyStartOfCombatEffects(combat, game.board, game.activeSynergiesByPlayer);
    if (getAliveUnitsBySide(combat, "home").length === 0 ||
        getAliveUnitsBySide(combat, "away").length === 0) {
        finalizeCombat(combat);
    }
    return combat;
}
function stepCombat(combat, deltaMs, board, activeSynergiesByPlayer) {
    if (combat.isFinished) {
        return combat;
    }
    combat.elapsedMs += deltaMs;
    tickStatuses(combat, deltaMs, board, activeSynergiesByPlayer);
    const units = combat.units
        .filter((unit) => unit.alive)
        .sort((left, right) => left.position.row - right.position.row || left.position.column - right.position.column);
    for (const unit of units) {
        if (!unit.alive) {
            continue;
        }
        unit.attackTimerMs -= deltaMs;
        unit.moveTimerMs -= deltaMs;
        const allies = combat.units.filter((entry) => entry.alive && entry.side === unit.side);
        const enemies = combat.units.filter((entry) => entry.alive && entry.side !== unit.side);
        if (enemies.length === 0) {
            break;
        }
        const template = unitData_1.unitById[unit.templateId];
        const target = (0, targetingSystem_1.chooseTarget)({
            source: unit,
            allies,
            enemies,
            rule: template?.ability.targeting ?? "nearest",
        }, board) ?? enemies[0];
        unit.targetId = target?.id ?? null;
        if (!target) {
            continue;
        }
        const isStunned = unit.statuses.some((status) => status.kind === "stun" && status.remainingMs > 0);
        if (isStunned) {
            continue;
        }
        if (maybeRetreatBird(combat, unit, target, board, activeSynergiesByPlayer)) {
            continue;
        }
        if (unit.mana >= unit.stats.maxMana) {
            castAbility(combat, unit, board, activeSynergiesByPlayer);
            continue;
        }
        if (isInRange(unit, target)) {
            if (unit.attackTimerMs <= 0) {
                performAttack(combat, unit, target, board, activeSynergiesByPlayer);
            }
            continue;
        }
        if (unit.moveTimerMs <= 0) {
            const instruction = (0, movementSystem_1.buildMovementInstruction)(unit, target, getOccupiedPositions(combat, unit.id), board);
            if (instruction) {
                unit.position = instruction.to;
                unit.side = instruction.to.side;
                unit.moveTimerMs = getMoveCooldown(unit);
                unit.hasMovedSinceAttack = true;
                pushEvent(combat, "move", `${unit.displayName} avance.`, unit.id);
            }
        }
    }
    const aliveHome = getAliveUnitsBySide(combat, "home");
    const aliveAway = getAliveUnitsBySide(combat, "away");
    if (aliveHome.length === 0 || aliveAway.length === 0 || combat.elapsedMs >= COMBAT_TIMEOUT_MS) {
        finalizeCombat(combat);
    }
    return combat;
}
