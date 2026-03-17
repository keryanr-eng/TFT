import type { GamePhase } from "../../types/gameTypes";

interface BoardActionBarProps {
  phase: GamePhase;
  onStartCombat: () => void;
  onAdvanceRound: () => void;
  onReset: () => void;
}

export function BoardActionBar({
  phase,
  onStartCombat,
  onAdvanceRound,
  onReset,
}: BoardActionBarProps) {
  return (
    <section className="tft-surface flex items-center justify-center gap-2 rounded-[1.5rem] px-4 py-2.5">
      <button
        className="rounded-full border border-cyan-300/20 bg-lagoon/88 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-50 transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(60,132,168,0.2)] disabled:cursor-not-allowed disabled:opacity-45"
        disabled={phase !== "prep"}
        onClick={onStartCombat}
        type="button"
      >
        Lancer le combat
      </button>
      <button
        className="rounded-full border border-orange-300/20 bg-coral/88 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-50 transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(255,132,92,0.18)] disabled:cursor-not-allowed disabled:opacity-45"
        disabled={phase !== "resolution"}
        onClick={onAdvanceRound}
        type="button"
      >
        Round suivant
      </button>
      <button
        className="rounded-full border border-amber-300/20 bg-amber-300/86 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-950 transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(247,201,72,0.16)]"
        onClick={onReset}
        type="button"
      >
        Nouvelle partie
      </button>
    </section>
  );
}
