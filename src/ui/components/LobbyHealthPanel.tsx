import clsx from "clsx";

interface LobbyHealthEntry {
  id: string;
  name: string;
  health: number;
  isHuman: boolean;
}

interface LobbyHealthPanelProps {
  players: LobbyHealthEntry[];
}

export function LobbyHealthPanel({ players }: LobbyHealthPanelProps) {
  return (
    <section className="tft-surface rounded-[1.2rem] p-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="tft-heading font-display text-sm">Lobby</h2>
        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          HP
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {players.map((player, index) => (
          <div
            key={player.id}
            className={clsx(
              "flex items-center justify-between rounded-[0.85rem] border px-2 py-1.5 text-[10px]",
              player.isHuman
                ? "border-cyan-300/16 bg-cyan-400/10"
                : "border-white/8 bg-white/[0.04]",
            )}
          >
            <span className="truncate font-semibold text-slate-200">
              {player.isHuman ? "Vous" : `B${index}`}
            </span>
            <span className="flex items-center gap-1 font-display text-[11px] text-slate-100">
              <span className="text-orange-400">{"\u2764"}</span>
              <span className={clsx(player.health <= 0 && "text-slate-500 line-through")}>{player.health}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
