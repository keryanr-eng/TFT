import type { PlayerState, RoundState } from "../../types/gameTypes";

interface HUDProps {
  player: PlayerState;
  round: RoundState;
}

export function HUD({ player, round }: HUDProps) {
  return (
    <section className="tft-surface flex items-center justify-between rounded-[1rem] px-2.5 py-1.5">
      <div className="flex items-center gap-1.5">
        <span className="rounded-full border border-orange-300/32 bg-[linear-gradient(180deg,rgba(255,132,92,0.3)_0%,rgba(255,132,92,0.12)_100%)] px-2.5 py-0.75 text-[9px] font-semibold uppercase tracking-[0.18em] text-orange-50 shadow-[0_0_18px_rgba(255,132,92,0.1)]">
          HP {player.health}
        </span>
        <span className="rounded-full border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] px-2.5 py-0.75 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-100">
          Round {round.stageLabel}
        </span>
      </div>

      <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        {round.kind}
      </span>
    </section>
  );
}
