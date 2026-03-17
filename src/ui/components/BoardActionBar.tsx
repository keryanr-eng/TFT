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
    <section className="tft-surface flex flex-wrap items-center justify-center gap-2 rounded-[1.5rem] px-3 py-2.5 lg:flex-nowrap lg:px-4">
      <button
        className="min-w-[13rem] rounded-full border border-cyan-200/50 bg-[linear-gradient(180deg,rgba(84,188,255,0.98)_0%,rgba(27,115,196,0.96)_100%)] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_16px_30px_rgba(36,133,226,0.28),inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:-translate-y-0.5 hover:border-cyan-100/70 hover:shadow-[0_18px_34px_rgba(36,133,226,0.34),inset_0_1px_0_rgba(255,255,255,0.22)] active:translate-y-0 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-[linear-gradient(180deg,rgba(46,59,79,0.74)_0%,rgba(23,31,45,0.7)_100%)] disabled:text-slate-500 disabled:shadow-none"
        disabled={phase !== "prep"}
        onClick={onStartCombat}
        type="button"
      >
        Lancer le combat
      </button>
      <button
        className="rounded-full border border-orange-200/34 bg-[linear-gradient(180deg,rgba(255,160,118,0.94)_0%,rgba(207,87,58,0.9)_100%)] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_14px_26px_rgba(207,87,58,0.2),inset_0_1px_0_rgba(255,255,255,0.14)] transition hover:-translate-y-0.5 hover:border-orange-100/55 hover:shadow-[0_16px_30px_rgba(207,87,58,0.24)] active:translate-y-0 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-[linear-gradient(180deg,rgba(46,59,79,0.74)_0%,rgba(23,31,45,0.7)_100%)] disabled:text-slate-500 disabled:shadow-none"
        disabled={phase !== "resolution"}
        onClick={onAdvanceRound}
        type="button"
      >
        Round suivant
      </button>
      <button
        className="rounded-full border border-amber-200/36 bg-[linear-gradient(180deg,rgba(251,218,102,0.96)_0%,rgba(214,166,44,0.92)_100%)] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-950 shadow-[0_14px_26px_rgba(214,166,44,0.16),inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:-translate-y-0.5 hover:border-amber-100/55 hover:shadow-[0_16px_30px_rgba(214,166,44,0.22)] active:translate-y-0"
        onClick={onReset}
        type="button"
      >
        Nouvelle partie
      </button>
    </section>
  );
}
