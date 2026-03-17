import clsx from "clsx";
import type { GamePhase, RoundState } from "../../types/gameTypes";

interface LobbyPlayerEntry {
  id: string;
  name: string;
  health: number;
  isHuman: boolean;
}

interface RoundSidebarProps {
  phase: GamePhase;
  round: RoundState;
  opponentLabel: string;
  livingBots: number;
  players: LobbyPlayerEntry[];
}

const phaseLabels: Record<GamePhase, string> = {
  bootstrap: "Chargement",
  prep: "Preparation",
  combat: "Combat",
  resolution: "Resultat",
  gameOver: "Fin de partie",
};

export function RoundSidebar({ phase, round, opponentLabel, livingBots, players }: RoundSidebarProps) {
  return (
    <section className="tft-surface rounded-[1.45rem] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">Round</p>
          <h2 className="mt-1 truncate font-display text-lg leading-none text-slate-100">{opponentLabel}</h2>
          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">
            {phaseLabels[phase]}
          </p>
        </div>
        <span className="rounded-full border border-cyan-300/18 bg-cyan-400/12 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
          {round.stageLabel}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-[0.95rem] border border-white/8 bg-white/[0.05] px-2.5 py-2">
          <p className="uppercase tracking-[0.14em] text-slate-400">Degats</p>
          <p className="mt-1 font-display text-base text-orange-100">{round.damageBase}</p>
        </div>
        <div className="rounded-[0.95rem] border border-white/8 bg-white/[0.05] px-2.5 py-2">
          <p className="uppercase tracking-[0.14em] text-slate-400">Bots</p>
          <p className="mt-1 font-display text-base text-cyan-100">{livingBots}</p>
        </div>
      </div>

      <div className="mt-3">
        <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">Lobby</p>
        <div className="space-y-1">
          {players.map((player) => (
            <div
              key={player.id}
              className={clsx(
                "flex items-center justify-between rounded-[0.85rem] border px-2.5 py-1.5 text-[10px]",
                player.isHuman
                  ? "border-cyan-300/18 bg-cyan-400/10"
                  : "border-white/8 bg-white/[0.04]",
              )}
            >
              <span className="truncate font-semibold text-slate-200">{player.name}</span>
              <span className="flex items-center gap-1.5 font-display text-sm text-slate-100">
                <span className="text-orange-400">{"\u2764"}</span>
                <span className={clsx(player.health <= 0 && "text-slate-500 line-through")}>{player.health}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
