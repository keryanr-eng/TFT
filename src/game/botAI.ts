import { unitById } from "../data/unitData";
import { getMaxDeployableUnits } from "../systems/levelSystem";
import type { GameState, PlayerId, PlayerState, UnitInstanceId, UnitTemplate } from "../types/gameTypes";
import { buyExperienceForPlayer, purchaseShopOffer, recalculatePlayerSynergies, refreshPlayerShop } from "./gameMutations";

export interface BotTurnPlan {
  botId: string;
  desiredUnitIds: string[];
  focusSynergy: string | null;
}

function scoreOffer(player: PlayerState, template: UnitTemplate): number {
  let score = template.cost * 4 + template.range;

  if (player.focusSynergyId && (template.familyId === player.focusSynergyId || template.traitIds.includes(player.focusSynergyId))) {
    score += 6;
  }

  score += player.rosterUnitIds.length < 5 ? 2 : 0;

  if (template.roleArchetype === "tank" || template.roleArchetype === "bruiser") {
    score += 1;
  }

  return score;
}

function getRolePriority(template: UnitTemplate): number {
  switch (template.roleArchetype) {
    case "tank":
      return 0;
    case "bruiser":
      return 1;
    case "hybrid":
      return 2;
    case "support":
      return 3;
    case "caster":
      return 4;
    case "marksman":
      return 5;
    case "assassin":
      return 6;
    default:
      return 7;
  }
}

function placeUnitsForBot(game: GameState, playerId: PlayerId): void {
  const player = game.players[playerId];
  if (!player) {
    return;
  }

  const maxUnits = getMaxDeployableUnits(player.experience.level);
  const units = player.rosterUnitIds
    .map((unitId) => ({
      unitId,
      instance: game.unitsById[unitId],
      template: unitById[game.unitsById[unitId]?.templateId ?? ""],
    }))
    .filter(
      (entry): entry is {
        unitId: UnitInstanceId;
        instance: GameState["unitsById"][string];
        template: UnitTemplate;
      } => Boolean(entry.instance && entry.template),
    )
    .sort((left, right) => {
      const starGap = right.instance.starLevel - left.instance.starLevel;
      if (starGap !== 0) {
        return starGap;
      }

      const costGap = right.template.cost - left.template.cost;
      if (costGap !== 0) {
        return costGap;
      }

      return getRolePriority(left.template) - getRolePriority(right.template);
    });

  player.boardSlots.forEach((slot) => {
    slot.unitInstanceId = null;
  });
  player.bench.forEach((slot) => {
    slot.unitInstanceId = null;
  });

  const selected = units.slice(0, maxUnits);
  const reserves = units.slice(maxUnits);

  const frontColumns = [1, 3, 5, 2, 4, 0, 6];
  const backColumns = [1, 3, 5, 2, 4, 0, 6];

  let frontCursor = 0;
  let backCursor = 0;

  for (const entry of selected) {
    const frontliner =
      entry.template.roleArchetype === "tank" || entry.template.roleArchetype === "bruiser";
    const row = frontliner
      ? frontCursor < game.board.columns
        ? 0
        : 1
      : backCursor < game.board.columns
        ? 3
        : 2;
    const column =
      frontliner
        ? frontColumns[frontCursor++ % frontColumns.length] ?? frontColumns[frontColumns.length - 1]
        : backColumns[backCursor++ % backColumns.length] ?? backColumns[backColumns.length - 1];
    const boardSlot = player.boardSlots.find((slot) => slot.row === row && slot.column === column);
    if (boardSlot) {
      boardSlot.unitInstanceId = entry.unitId;
    }
  }

  reserves.forEach((entry, index) => {
    const benchSlot = player.bench[index];
    if (benchSlot) {
      benchSlot.unitInstanceId = entry.unitId;
    }
  });

  recalculatePlayerSynergies(game, playerId);
}

export function planBotTurn(bot: PlayerState, shopPool: UnitTemplate[]): BotTurnPlan {
  const desiredUnits = shopPool
    .filter((unit) => unit.cost <= Math.max(1, Math.min(5, bot.experience.level - 1)))
    .slice(0, 3)
    .map((unit) => unit.id);

  return {
    botId: bot.id,
    desiredUnitIds: desiredUnits,
    focusSynergy: shopPool[0]?.familyId ?? null,
  };
}

export function runBotPrepTurn(game: GameState, playerId: PlayerId): void {
  const player = game.players[playerId];
  if (!player || player.isEliminated) {
    return;
  }

  if (player.experience.level < 8 && player.economy.gold >= 20) {
    buyExperienceForPlayer(game, playerId);
  }

  for (let actionIndex = 0; actionIndex < 6; actionIndex += 1) {
    const scoredOffers = player.shop.offers
      .map((offer) => ({
        offer,
        template: unitById[offer.unitId],
      }))
      .filter((entry): entry is { offer: PlayerState["shop"]["offers"][number]; template: UnitTemplate } =>
        Boolean(entry.template && entry.offer.cost <= player.economy.gold),
      )
      .map((entry) => ({
        ...entry,
        score: scoreOffer(player, entry.template),
      }))
      .sort((left, right) => right.score - left.score);

    if (scoredOffers.length === 0) {
      if (player.economy.gold >= player.shop.rerollCost + 2 && actionIndex < 2) {
        refreshPlayerShop(game, playerId, true);
        continue;
      }

      break;
    }

    const best = scoredOffers[0];
    if (best.score < 4) {
      if (player.economy.gold >= player.shop.rerollCost + 3 && actionIndex < 3) {
        refreshPlayerShop(game, playerId, true);
      }
      break;
    }

    purchaseShopOffer(game, playerId, best.offer.slotIndex);

    if (player.focusSynergyId === null) {
      player.focusSynergyId = best.template.familyId;
    }

    if (player.economy.gold >= player.shop.rerollCost + 6 && actionIndex < 2) {
      refreshPlayerShop(game, playerId, true);
    }
  }

  placeUnitsForBot(game, playerId);
}
