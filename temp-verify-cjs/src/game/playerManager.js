"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAlive = isAlive;
exports.getLivingPlayerIds = getLivingPlayerIds;
exports.applyDamageToPlayer = applyDamageToPlayer;
function isAlive(participant) {
    return participant.health > 0;
}
function getLivingPlayerIds(game) {
    return game.playerOrder.filter((playerId) => {
        const player = game.players[playerId];
        return player && !player.isEliminated && player.health > 0;
    });
}
function applyDamageToPlayer(player, amount) {
    player.health = Math.max(0, player.health - amount);
    if (player.health <= 0) {
        player.isEliminated = true;
    }
}
