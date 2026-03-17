import type { BotSummary, GameState, PlayerId, PlayerState } from "../types/gameTypes";

export function isAlive(participant: PlayerState | BotSummary): boolean {
  return participant.health > 0;
}

export function getLivingPlayerIds(game: GameState): PlayerId[] {
  return game.playerOrder.filter((playerId) => {
    const player = game.players[playerId];
    return player && !player.isEliminated && player.health > 0;
  });
}

export function applyDamageToPlayer(player: PlayerState, amount: number): void {
  player.health = Math.max(0, player.health - amount);
  if (player.health <= 0) {
    player.isEliminated = true;
  }
}

