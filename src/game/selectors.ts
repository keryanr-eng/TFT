import { unitById } from "../data/unitData";
import { buildAbilityHoverSnapshot } from "../systems/abilityPresentationSystem";
import { buildBaseResolvedStats, buildResolvedStatsWithItems, createEmptyHoverStatsSnapshot } from "../systems/itemSystem";
import type {
  ActiveSynergyState,
  AbilityHoverSnapshot,
  BoardSide,
  BotSummary,
  CombatEvent,
  CombatUnitState,
  GameState,
  GamePhase,
  HoverStatsSnapshot,
  PlayerState,
  UnitInstance,
  UnitTemplate,
} from "../types/gameTypes";

export interface RenderUnitState {
  instanceId: string;
  template: UnitTemplate;
  starLevel: number;
  currentHealth: number;
  currentMana: number;
  maxHealth: number;
  maxMana: number;
  side: BoardSide;
  isAlive: boolean;
  stats: HoverStatsSnapshot;
  itemBonuses: HoverStatsSnapshot;
  itemIds: string[];
  ability: AbilityHoverSnapshot;
}

export interface RenderBoardCell {
  row: number;
  column: number;
  side: BoardSide;
  unit: RenderUnitState | null;
}

export interface RenderBenchSlot {
  slotIndex: number;
  unit: RenderUnitState | null;
}

export interface CombatResultSummary {
  outcome: "victory" | "defeat" | "draw";
  title: string;
  subtitle: string;
  damage: number;
  roundLabel: string;
}

export interface DebugSnapshot {
  phase: GamePhase;
  roundLabel: string;
  combatElapsedMs: number;
  homeUnits: number;
  awayUnits: number;
  activeSynergies: string[];
}

function toRenderPersistentUnit(unit: UnitInstance, side: BoardSide): RenderUnitState | null {
  const template = unitById[unit.templateId];
  if (!template) {
    return null;
  }

  const { stats: resolvedStats, itemBonuses } = buildResolvedStatsWithItems(template, unit.starLevel, unit.items);

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
    ability: buildAbilityHoverSnapshot(template, unit.items),
  };
}

export function createPreviewRenderUnit(template: UnitTemplate): RenderUnitState {
  const baseStats = buildBaseResolvedStats(template, 1);
  const emptyItemBonuses = createEmptyHoverStatsSnapshot();

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
    ability: buildAbilityHoverSnapshot(template, []),
  };
}

function toRenderCombatUnit(unit: CombatUnitState): RenderUnitState | null {
  const template = unitById[unit.templateId];
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
    itemBonuses: buildResolvedStatsWithItems(template, unit.starLevel, unit.items).itemBonuses,
    itemIds: unit.items,
    ability: buildAbilityHoverSnapshot(template, unit.items),
  };
}

export function getHumanPlayer(game: GameState): PlayerState {
  return game.players[game.humanPlayerId];
}

export function getOpponentPlayer(game: GameState): PlayerState | null {
  if (!game.matchup) {
    return null;
  }

  return game.players[game.matchup.awayPlayerId] ?? null;
}

export function getHumanBench(game: GameState): RenderBenchSlot[] {
  const player = getHumanPlayer(game);

  return player.bench.map((slot) => ({
    slotIndex: slot.slotIndex,
    unit:
      slot.unitInstanceId && game.unitsById[slot.unitInstanceId]
        ? toRenderPersistentUnit(game.unitsById[slot.unitInstanceId], "home")
        : null,
  }));
}

function buildPrepBoard(game: GameState, player: PlayerState, side: BoardSide): RenderBoardCell[] {
  return player.boardSlots.map((slot) => ({
    row: slot.row,
    column: slot.column,
    side,
    unit:
      slot.unitInstanceId && game.unitsById[slot.unitInstanceId]
        ? toRenderPersistentUnit(game.unitsById[slot.unitInstanceId], side)
        : null,
  }));
}

function buildCombatBoard(game: GameState): RenderBoardCell[] {
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

export function getRenderBoard(game: GameState): RenderBoardCell[] {
  if (game.phase === "combat" && game.combat) {
    return buildCombatBoard(game);
  }

  const home = buildPrepBoard(game, getHumanPlayer(game), "home");
  const awayPlayer = getOpponentPlayer(game);
  const away = awayPlayer ? buildPrepBoard(game, awayPlayer, "away") : [];
  return [...away, ...home];
}

export function getHumanActiveSynergies(game: GameState): ActiveSynergyState[] {
  return game.activeSynergiesByPlayer[game.humanPlayerId] ?? [];
}

export function getHumanItemInventory(game: GameState): string[] {
  return getHumanPlayer(game).itemInventory;
}

export function getHumanBoardUnitCount(game: GameState): number {
  return getHumanPlayer(game).boardSlots.filter((slot) => slot.unitInstanceId !== null).length;
}

export function getBotSummaries(game: GameState): BotSummary[] {
  return game.playerOrder
    .map((playerId) => game.players[playerId])
    .filter((player): player is PlayerState => Boolean(player && player.kind === "bot"))
    .map((player) => ({
      id: player.id,
      name: player.name,
      health: player.health,
      level: player.experience.level,
      gold: player.economy.gold,
      identity: player.focusSynergyId ?? "flex",
    }));
}

export function getCombatEvents(game: GameState): CombatEvent[] {
  return game.combat?.events.slice(-8) ?? [];
}

export function getCombatResultSummary(game: GameState): CombatResultSummary | null {
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
      subtitle:
        game.combat.damageToAway > 0
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

export function getDebugSnapshot(game: GameState): DebugSnapshot {
  const combatUnits = game.combat?.units ?? [];
  const homeUnits =
    combatUnits.length > 0
      ? combatUnits.filter((unit) => unit.side === "home" && unit.alive).length
      : getHumanBoardUnitCount(game);
  const awayUnits =
    combatUnits.length > 0
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
