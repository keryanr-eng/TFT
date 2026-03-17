import { unitById } from "../data/unitData";
import { buildMovementInstruction, buildRetreatInstruction } from "./movementSystem";
import { chooseTarget } from "./targetingSystem";
import { resolveAbilityData } from "../systems/abilitySystem";
import { buildResolvedStatsWithItems } from "../systems/itemSystem";
import { getActiveSynergyTier } from "../systems/synergySystem";
import type {
  ActiveSynergyState,
  BoardDefinition,
  BoardSide,
  CombatEvent,
  CombatState,
  CombatStatusEffect,
  CombatUnitState,
  GameState,
  MatchupState,
} from "../types/gameTypes";

const COMBAT_TIMEOUT_MS = 45_000;

function pushEvent(
  combat: CombatState,
  kind: CombatEvent["kind"],
  description: string,
  sourceUnitId?: string,
  targetUnitId?: string,
): void {
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

function getBaseDamage(kind: MatchupState["kind"]): number {
  if (kind === "boss") {
    return 6;
  }

  if (kind === "pve") {
    return 2;
  }

  return 3;
}

function getAttackSpeedMultiplier(unit: CombatUnitState): number {
  const slow = unit.statuses
    .filter((status) => status.kind === "slow" && status.remainingMs > 0)
    .reduce((total, status) => total + status.value, 0);
  const bonus = unit.statuses
    .filter((status) => status.kind === "attack-speed" && status.remainingMs > 0)
    .reduce((total, status) => total + status.value, 0);

  return Math.max(0.35, 1 + bonus - slow);
}

function getAttackCooldown(unit: CombatUnitState): number {
  return 1000 / Math.max(0.35, unit.stats.attackSpeed * getAttackSpeedMultiplier(unit));
}

function getMoveCooldown(unit: CombatUnitState): number {
  return 650 / Math.max(0.45, unit.stats.moveSpeed);
}

function getDistance(left: CombatUnitState, right: CombatUnitState): number {
  return Math.abs(left.position.row - right.position.row) + Math.abs(left.position.column - right.position.column);
}

function isInRange(attacker: CombatUnitState, target: CombatUnitState): boolean {
  return getDistance(attacker, target) <= attacker.stats.range;
}

function getOccupiedPositions(combat: CombatState, excludeId?: string): Set<string> {
  return new Set(
    combat.units
      .filter((unit) => unit.alive && unit.id !== excludeId)
      .map((unit) => `${unit.position.row}:${unit.position.column}`),
  );
}

function getAliveUnitsBySide(combat: CombatState, side: BoardSide): CombatUnitState[] {
  return combat.units.filter((unit) => unit.alive && unit.side === side);
}

function getPlayerSynergies(
  activeSynergiesByPlayer: Record<string, ActiveSynergyState[]>,
  playerId: string,
): ActiveSynergyState[] {
  return activeSynergiesByPlayer[playerId] ?? [];
}

function addStatus(
  unit: CombatUnitState,
  kind: CombatStatusEffect["kind"],
  name: string,
  value: number,
  durationMs: number,
  sourceUnitId?: string,
  tickRateMs?: number,
): void {
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

function healUnit(combat: CombatState, unit: CombatUnitState, amount: number, sourceUnitId?: string): void {
  if (!unit.alive || amount <= 0) {
    return;
  }

  const nextHealth = Math.min(unit.stats.maxHealth, unit.health + amount);
  const restored = nextHealth - unit.health;
  if (restored <= 0) {
    return;
  }

  unit.health = nextHealth;
  pushEvent(
    combat,
    "heal",
    `${unit.displayName} recupere ${Math.round(restored)} PV.`,
    sourceUnitId,
    unit.id,
  );
}

function getMitigationMultiplier(value: number): number {
  if (value >= 0) {
    return 100 / (100 + value);
  }

  return 2 - 100 / (100 - value);
}

function applyDamage(
  combat: CombatState,
  target: CombatUnitState,
  amount: number,
  damageType: "physical" | "magic" | "true",
  sourceUnitId: string | undefined,
  board: BoardDefinition,
  activeSynergiesByPlayer: Record<string, ActiveSynergyState[]>,
): number {
  if (!target.alive || amount <= 0) {
    return 0;
  }

  let damage = amount;
  if (damageType === "physical") {
    damage *= getMitigationMultiplier(target.stats.armor);
  } else if (damageType === "magic") {
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

function createSummon(
  combat: CombatState,
  summoner: CombatUnitState,
  label: string,
  factor: number,
  board: BoardDefinition,
): void {
  const template = unitById[summoner.templateId];
  if (!template) {
    return;
  }

  const occupied = getOccupiedPositions(combat);
  const candidates = [
    { row: summoner.position.row, column: summoner.position.column + 1 },
    { row: summoner.position.row, column: summoner.position.column - 1 },
    { row: summoner.position.row + (summoner.side === "home" ? -1 : 1), column: summoner.position.column },
    { row: summoner.position.row + (summoner.side === "home" ? 1 : -1), column: summoner.position.column },
  ].filter(
    (position) =>
      position.row >= 0 &&
      position.row < board.awayRows + board.homeRows &&
      position.column >= 0 &&
      position.column < board.columns &&
      !occupied.has(`${position.row}:${position.column}`),
  );

  const spawnPosition = candidates[0];
  if (!spawnPosition) {
    return;
  }

  const summon: CombatUnitState = {
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

function handleDeath(
  combat: CombatState,
  unit: CombatUnitState,
  killerId: string | undefined,
  board: BoardDefinition,
  activeSynergiesByPlayer: Record<string, ActiveSynergyState[]>,
): void {
  if (!unit.alive) {
    return;
  }

  const synergies = getPlayerSynergies(activeSynergiesByPlayer, unit.ownerId);
  const porcineTier = unit.familyId === "porcins" ? getActiveSynergyTier(synergies, "porcins") : 0;
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

  const reptileTier = unit.familyId === "reptiles" ? getActiveSynergyTier(synergies, "reptiles") : 0;
  if (reptileTier >= 3) {
    const enemies = combat.units.filter(
      (enemy) => enemy.alive && enemy.side !== unit.side && getDistance(unit, enemy) <= 1,
    );
    for (const enemy of enemies) {
      addStatus(enemy, "poison", "Explosion toxique", 16, 2500, unit.id, 500);
    }
  }

  const rodentTier = unit.familyId === "rongeurs" ? getActiveSynergyTier(synergies, "rongeurs") : 0;
  if (rodentTier >= 1) {
    const amount = rodentTier >= 2 ? 2 : 1;
    const factor = rodentTier >= 3 ? 0.45 : 0.32;
    for (let index = 0; index < amount; index += 1) {
      createSummon(combat, unit, "Rat", factor, board);
    }
  }

  const contagiousTier = unit.traitIds.includes("contagieux")
    ? getActiveSynergyTier(synergies, "contagieux")
    : 0;
  if (contagiousTier >= 2) {
    const nearbyEnemies = combat.units.filter(
      (enemy) => enemy.alive && enemy.side !== unit.side && getDistance(unit, enemy) <= 2,
    );
    for (const enemy of nearbyEnemies) {
      addStatus(enemy, "poison", "Infection", 12, 2500, unit.id, 500);
    }
  }

  const killer = combat.units.find((entry) => entry.id === killerId);
  if (killer) {
    killer.kills += 1;
  }
}

function getNearestAlly(
  combat: CombatState,
  caster: CombatUnitState,
  includeSelf = false,
): CombatUnitState | null {
  return combat.units
    .filter((unit) => unit.alive && unit.side === caster.side && (includeSelf || unit.id !== caster.id))
    .sort((left, right) => getDistance(caster, left) - getDistance(caster, right))[0] ?? null;
}

function applyFamilyStatBonuses(unit: CombatUnitState, synergies: ActiveSynergyState[]): void {
  if (unit.familyId === "equides") {
    const tier = getActiveSynergyTier(synergies, "equides");
    if (tier >= 1) {
      unit.stats.moveSpeed *= 1.25;
    }
  }

  if (unit.familyId === "felins") {
    const tier = getActiveSynergyTier(synergies, "felins");
    if (tier >= 1) {
      unit.stats.critChance += 0.2;
    }
  }

  if (unit.familyId === "oiseaux") {
    const tier = getActiveSynergyTier(synergies, "oiseaux");
    if (tier >= 1) {
      unit.stats.range += 1;
    }
  }

  if (unit.familyId === "porcins") {
    const tier = getActiveSynergyTier(synergies, "porcins");
    if (tier >= 1) {
      unit.stats.maxHealth = Math.round(unit.stats.maxHealth * 1.15);
      unit.health = unit.stats.maxHealth;
    }
  }
}

function buildCombatUnit(
  game: GameState,
  persistentUnitId: string,
  row: number,
  column: number,
  side: BoardSide,
): CombatUnitState | null {
  const persistent = game.unitsById[persistentUnitId];
  const template = persistent ? unitById[persistent.templateId] : null;
  if (!persistent || !template) {
    return null;
  }

  const { stats } = buildResolvedStatsWithItems(template, persistent.starLevel, persistent.items);

  const combatUnit: CombatUnitState = {
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

  applyFamilyStatBonuses(
    combatUnit,
    getPlayerSynergies(game.activeSynergiesByPlayer, persistent.ownerId),
  );

  return combatUnit;
}

function buildPlayerArmy(
  game: GameState,
  playerId: string,
  side: BoardSide,
): CombatUnitState[] {
  const player = game.players[playerId];
  if (!player) {
    return [];
  }

  return player.boardSlots
    .filter((slot) => slot.unitInstanceId !== null)
    .map((slot) =>
      buildCombatUnit(
        game,
        slot.unitInstanceId!,
        side === "away" ? slot.row : game.board.awayRows + slot.row,
        slot.column,
        side,
      ),
    )
    .filter((unit): unit is CombatUnitState => Boolean(unit));
}

function applyStartOfCombatEffects(
  combat: CombatState,
  board: BoardDefinition,
  activeSynergiesByPlayer: Record<string, ActiveSynergyState[]>,
): void {
  for (const unit of combat.units) {
    const synergies = getPlayerSynergies(activeSynergiesByPlayer, unit.ownerId);

    if (unit.familyId === "aquatiques" && getActiveSynergyTier(synergies, "aquatiques") >= 3) {
      const enemies = combat.units.filter(
        (enemy) => enemy.alive && enemy.side !== unit.side && getDistance(unit, enemy) <= 2,
      );
      for (const enemy of enemies) {
        addStatus(enemy, "slow", "Vague initiale", 0.18, 2000, unit.id);
      }
    }

    if (unit.familyId === "equides" && getActiveSynergyTier(synergies, "equides") >= 3) {
      const enemies = combat.units.filter((enemy) => enemy.alive && enemy.side !== unit.side);
      const nearest = enemies.sort((left, right) => getDistance(unit, left) - getDistance(unit, right))[0];
      if (nearest) {
        const instruction = buildMovementInstruction(unit, nearest, getOccupiedPositions(combat, unit.id), board);
        if (instruction) {
          unit.position = instruction.to;
        }
      }
    }
  }
}

function computePackBonus(
  attacker: CombatUnitState,
  target: CombatUnitState,
  allies: CombatUnitState[],
  synergies: ActiveSynergyState[],
): number {
  if (attacker.familyId !== "canides") {
    return 1;
  }

  const tier = getActiveSynergyTier(synergies, "canides");
  if (tier === 0) {
    return 1;
  }

  const focusCount = allies.filter(
    (ally) => ally.alive && ally.familyId === "canides" && ally.targetId === target.id,
  ).length;

  if (focusCount === 0) {
    return 1;
  }

  if (tier >= 2) {
    return 1.3;
  }

  return 1.15;
}

function performAttack(
  combat: CombatState,
  attacker: CombatUnitState,
  target: CombatUnitState,
  board: BoardDefinition,
  activeSynergiesByPlayer: Record<string, ActiveSynergyState[]>,
): void {
  const synergies = getPlayerSynergies(activeSynergiesByPlayer, attacker.ownerId);
  const allies = combat.units.filter((unit) => unit.alive && unit.side === attacker.side);
  const movedBeforeAttack = attacker.hasMovedSinceAttack;

  let damage = attacker.stats.attackDamage;
  damage *= computePackBonus(attacker, target, allies, synergies);

  if (
    attacker.familyId === "felins" &&
    getActiveSynergyTier(synergies, "felins") >= 3 &&
    target.health / target.stats.maxHealth <= 0.35
  ) {
    damage *= 1.4;
  }

  if (Math.random() < attacker.stats.critChance) {
    damage *= attacker.stats.critDamage;
  }

  const dealt = applyDamage(
    combat,
    target,
    damage,
    "physical",
    attacker.id,
    board,
    activeSynergiesByPlayer,
  );
  attacker.attacksMade += 1;
  attacker.mana = Math.min(attacker.stats.maxMana, attacker.mana + attacker.stats.manaGainPerAttack);
  attacker.attackTimerMs = getAttackCooldown(attacker);

  pushEvent(
    combat,
    "attack",
    `${attacker.displayName} frappe ${target.displayName} pour ${Math.round(dealt)}.`,
    attacker.id,
    target.id,
  );

  if (attacker.familyId === "aquatiques" && getActiveSynergyTier(synergies, "aquatiques") >= 1) {
    addStatus(target, "slow", "Ralentissement marin", 0.2, 2000, attacker.id);
  }

  if (attacker.familyId === "arachnides" && !attacker.firstAttackDone) {
    const duration = getActiveSynergyTier(synergies, "arachnides") >= 2 ? 1000 : 700;
    addStatus(target, "stun", "Toile", 0, duration, attacker.id);
  }

  if (
    attacker.familyId === "equides" &&
    getActiveSynergyTier(synergies, "equides") >= 2 &&
    movedBeforeAttack
  ) {
    addStatus(target, "stun", "Impact de charge", 0, 750, attacker.id);
  }

  if (attacker.familyId === "reptiles" && getActiveSynergyTier(synergies, "reptiles") >= 1) {
    addStatus(target, "poison", "Poison", 12, 3000, attacker.id, 500);
  }

  if (attacker.traitIds.includes("contagieux") && getActiveSynergyTier(synergies, "contagieux") >= 1) {
    addStatus(target, "poison", "Infection", 10, 2500, attacker.id, 500);
    if (getActiveSynergyTier(synergies, "contagieux") >= 3) {
      addStatus(target, "anti-heal", "Plaie infectee", 0.3, 2500, attacker.id);
    }
  }

  if (
    attacker.familyId === "canides" &&
    getActiveSynergyTier(synergies, "canides") >= 3 &&
    target.alive &&
    target.health / target.stats.maxHealth <= 0.2
  ) {
    applyDamage(
      combat,
      target,
      target.health + 1,
      "true",
      attacker.id,
      board,
      activeSynergiesByPlayer,
    );
  }

  const insectTier = attacker.familyId === "insectes" ? getActiveSynergyTier(synergies, "insectes") : 0;
  if (insectTier >= 1) {
    const triggerEvery = insectTier >= 2 ? 4 : 5;
    if (attacker.attacksMade % triggerEvery === 0) {
      createSummon(combat, attacker, "Mini-insecte", insectTier >= 3 ? 0.55 : 0.38, board);
    }
  }

  attacker.firstAttackDone = true;
  attacker.hasMovedSinceAttack = false;

  if (!target.alive && attacker.familyId === "felins" && getActiveSynergyTier(synergies, "felins") >= 2) {
    attacker.attackTimerMs = 0;
    attacker.targetId = null;
  }
}

function castAbility(
  combat: CombatState,
  caster: CombatUnitState,
  board: BoardDefinition,
  activeSynergiesByPlayer: Record<string, ActiveSynergyState[]>,
): void {
  const template = unitById[caster.templateId];
  if (!template) {
    return;
  }

  const allies = combat.units.filter((unit) => unit.alive && unit.side === caster.side);
  const enemies = combat.units.filter((unit) => unit.alive && unit.side !== caster.side);
  const abilityData = resolveAbilityData(template, caster.stats, caster.starLevel);
  const target =
    chooseTarget(
      {
        source: caster,
        allies,
        enemies,
        rule: template.ability.targeting,
      },
      board,
    ) ?? enemies[0];

  pushEvent(combat, "cast", `${caster.displayName} lance ${template.ability.name}.`, caster.id, target?.id);

  switch (template.ability.visualStyle) {
    case "buff": {
      const ally = getNearestAlly(combat, caster, true);
      if (abilityData.shield) {
        addStatus(
          caster,
          "shield",
          "Bouclier",
          abilityData.shield.amount,
          abilityData.shield.durationMs,
          caster.id,
        );
      }

      if (ally) {
        if (abilityData.manaGain) {
          ally.mana = Math.min(ally.stats.maxMana, ally.mana + abilityData.manaGain.amount);
        }
        if (abilityData.attackSpeedBuff) {
          addStatus(
            ally,
            "attack-speed",
            "Boost",
            abilityData.attackSpeedBuff.amount,
            abilityData.attackSpeedBuff.durationMs,
            caster.id,
          );
        }
      }
      break;
    }
    case "pulse": {
      const ally = getNearestAlly(combat, caster);
      if (ally && abilityData.manaGain && abilityData.attackSpeedBuff) {
        ally.mana = Math.min(ally.stats.maxMana, ally.mana + abilityData.manaGain.amount);
        addStatus(
          ally,
          "attack-speed",
          "Tempo",
          abilityData.attackSpeedBuff.amount,
          abilityData.attackSpeedBuff.durationMs,
          caster.id,
        );
      } else if (target && abilityData.damage) {
        const splashTargets = enemies.filter(
          (enemy) => getDistance(enemy, target) <= (abilityData.damage?.areaRadius ?? 0),
        );
        for (const splashTarget of splashTargets) {
          applyDamage(
            combat,
            splashTarget,
            abilityData.damage.amount,
            abilityData.damage.damageType,
            caster.id,
            board,
            activeSynergiesByPlayer,
          );
          if (abilityData.slow) {
            addStatus(
              splashTarget,
              "slow",
              "Onde",
              abilityData.slow.amount,
              abilityData.slow.durationMs,
              caster.id,
            );
          }
        }
      }
      break;
    }
    case "charge": {
      if (target) {
        const instruction = buildMovementInstruction(caster, target, getOccupiedPositions(combat, caster.id), board);
        if (instruction) {
          caster.position = instruction.to;
          caster.side = instruction.to.side;
        }

        if (abilityData.damage) {
          applyDamage(
            combat,
            target,
            abilityData.damage.amount,
            abilityData.damage.damageType,
            caster.id,
            board,
            activeSynergiesByPlayer,
          );
        }
        if (abilityData.stun) {
          addStatus(target, "stun", "Charge", 0, abilityData.stun.durationMs, caster.id);
        }
      }
      break;
    }
    case "zone": {
      if (target) {
        const radius = abilityData.damage?.areaRadius ?? abilityData.slow?.areaRadius ?? abilityData.poison?.areaRadius ?? abilityData.stun?.areaRadius ?? 0;
        const targets = enemies.filter((enemy) => getDistance(enemy, target) <= radius);
        for (const zoneTarget of targets) {
          if (abilityData.damage) {
            applyDamage(
              combat,
              zoneTarget,
              abilityData.damage.amount,
              abilityData.damage.damageType,
              caster.id,
              board,
              activeSynergiesByPlayer,
            );
          }
          if (abilityData.slow) {
            addStatus(
              zoneTarget,
              "slow",
              "Zone collante",
              abilityData.slow.amount,
              abilityData.slow.durationMs,
              caster.id,
            );
          }
          if (abilityData.poison) {
            addStatus(
              zoneTarget,
              "poison",
              "Nuage toxique",
              abilityData.poison.damagePerTick,
              abilityData.poison.durationMs,
              caster.id,
              abilityData.poison.tickRateMs,
            );
          }
          if (abilityData.stun) {
            addStatus(zoneTarget, "stun", "Vague", 0, abilityData.stun.durationMs, caster.id);
          }
        }
      }
      break;
    }
    case "summon": {
      if (target && abilityData.damage) {
        applyDamage(
          combat,
          target,
          abilityData.damage.amount,
          abilityData.damage.damageType,
          caster.id,
          board,
          activeSynergiesByPlayer,
        );
      }
      if (abilityData.summon) {
        createSummon(combat, caster, abilityData.summon.label, abilityData.summon.factor, board);
      }
      break;
    }
    case "projectile":
    default: {
      if (target) {
        if (abilityData.damage) {
          applyDamage(
            combat,
            target,
            abilityData.damage.amount,
            abilityData.damage.damageType,
            caster.id,
            board,
            activeSynergiesByPlayer,
          );
        }

        if (abilityData.stun) {
          addStatus(target, "stun", "Impact", 0, abilityData.stun.durationMs, caster.id);
        }

        if (abilityData.reposition === "retreat") {
          const instruction = buildRetreatInstruction(
            caster,
            target,
            getOccupiedPositions(combat, caster.id),
            board,
          );
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
  if (caster.familyId === "aquatiques" && getActiveSynergyTier(casterSynergies, "aquatiques") >= 2 && target) {
    addStatus(target, "stun", "Remous", 0, 350, caster.id);
  }

  caster.mana = 0;
  caster.castsMade += 1;
  caster.attackTimerMs = Math.max(caster.attackTimerMs, 350);
}

function tickStatuses(
  combat: CombatState,
  deltaMs: number,
  board: BoardDefinition,
  activeSynergiesByPlayer: Record<string, ActiveSynergyState[]>,
): void {
  for (const unit of combat.units) {
    if (!unit.alive) {
      continue;
    }

    const synergies = getPlayerSynergies(activeSynergiesByPlayer, unit.ownerId);
    if (
      unit.familyId === "porcins" &&
      getActiveSynergyTier(synergies, "porcins") >= 2 &&
      unit.health / unit.stats.maxHealth <= 0.5
    ) {
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

function maybeRetreatBird(
  combat: CombatState,
  unit: CombatUnitState,
  target: CombatUnitState,
  board: BoardDefinition,
  activeSynergiesByPlayer: Record<string, ActiveSynergyState[]>,
): boolean {
  const synergies = getPlayerSynergies(activeSynergiesByPlayer, unit.ownerId);
  if (unit.familyId !== "oiseaux" || getActiveSynergyTier(synergies, "oiseaux") < 2) {
    return false;
  }

  if (getDistance(unit, target) > 1 || unit.moveTimerMs > 0) {
    return false;
  }

  const retreat = buildRetreatInstruction(unit, target, getOccupiedPositions(combat, unit.id), board);
  if (!retreat) {
    return false;
  }

  unit.position = retreat.to;
  unit.side = retreat.to.side;
  unit.moveTimerMs = getMoveCooldown(unit);
  unit.hasMovedSinceAttack = true;
  pushEvent(combat, "move", `${unit.displayName} recule.`, unit.id);

  if (getActiveSynergyTier(synergies, "oiseaux") >= 3) {
    addStatus(unit, "attack-speed", "Kiting", 0.3, 3000, unit.id);
  }

  return true;
}

function finalizeCombat(combat: CombatState): void {
  const aliveHome = getAliveUnitsBySide(combat, "home");
  const aliveAway = getAliveUnitsBySide(combat, "away");

  if (aliveHome.length === 0 && aliveAway.length === 0) {
    combat.winner = "draw";
  } else if (aliveAway.length === 0) {
    combat.winner = "home";
  } else if (aliveHome.length === 0) {
    combat.winner = "away";
  } else {
    const homeHealth = aliveHome.reduce((sum, unit) => sum + unit.health, 0);
    const awayHealth = aliveAway.reduce((sum, unit) => sum + unit.health, 0);
    if (homeHealth === awayHealth) {
      combat.winner = "draw";
    } else {
      combat.winner = homeHealth > awayHealth ? "home" : "away";
    }
  }

  const baseDamage = getBaseDamage(combat.matchup.kind);
  const survivingValue = (side: BoardSide) =>
    combat.units
      .filter((unit) => unit.alive && unit.side === side && !unit.isSummon)
      .reduce((sum, unit) => sum + unit.summonValue + unit.starLevel - 1, 0);

  combat.damageToHome = combat.winner === "away" ? baseDamage + survivingValue("away") : 0;
  combat.damageToAway = combat.winner === "home" ? baseDamage + survivingValue("home") : 0;
  combat.isFinished = true;
  pushEvent(combat, "round-end", `Combat termine: ${combat.winner}.`);
}

export function createCombatState(game: GameState): CombatState {
  const matchup = game.matchup!;
  const combat: CombatState = {
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

  if (
    getAliveUnitsBySide(combat, "home").length === 0 ||
    getAliveUnitsBySide(combat, "away").length === 0
  ) {
    finalizeCombat(combat);
  }

  return combat;
}

export function stepCombat(
  combat: CombatState,
  deltaMs: number,
  board: BoardDefinition,
  activeSynergiesByPlayer: Record<string, ActiveSynergyState[]>,
): CombatState {
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

    const template = unitById[unit.templateId];
    const target =
      chooseTarget(
        {
          source: unit,
          allies,
          enemies,
          rule: template?.ability.targeting ?? "nearest",
        },
        board,
      ) ?? enemies[0];

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
      const instruction = buildMovementInstruction(
        unit,
        target,
        getOccupiedPositions(combat, unit.id),
        board,
      );
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
