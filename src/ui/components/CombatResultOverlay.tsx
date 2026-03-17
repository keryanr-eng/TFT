import clsx from "clsx";
import type { CombatResultSummary } from "../../game/selectors";

interface CombatResultOverlayProps {
  result: CombatResultSummary | null;
  isGameOver: boolean;
  onAdvance: () => void;
  onReset: () => void;
}

export function CombatResultOverlay({
  result,
  isGameOver,
  onAdvance,
  onReset,
}: CombatResultOverlayProps) {
  if (!result) {
    return null;
  }

  const accentClass =
    result.outcome === "victory"
      ? "border-emerald-300/35 bg-[linear-gradient(180deg,rgba(13,58,52,0.95)_0%,rgba(8,27,25,0.95)_100%)] text-emerald-50"
      : result.outcome === "defeat"
        ? "border-orange-300/35 bg-[linear-gradient(180deg,rgba(73,28,24,0.95)_0%,rgba(37,14,12,0.95)_100%)] text-orange-50"
        : "border-amber-300/35 bg-[linear-gradient(180deg,rgba(68,55,18,0.95)_0%,rgba(32,25,8,0.95)_100%)] text-amber-50";

  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-slate-950/58 backdrop-blur-[3px]">
      <div className="result-pop pointer-events-auto w-full max-w-lg px-4">
        <article className={clsx("rounded-[2rem] border px-6 py-6 text-center shadow-[0_24px_60px_rgba(0,0,0,0.36)]", accentClass)}>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] opacity-80">
            Round {result.roundLabel}
          </p>
          <h3 className="mt-3 font-display text-5xl leading-none">{result.title}</h3>
          <p className="mt-3 text-base leading-relaxed opacity-90">{result.subtitle}</p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <span className="rounded-full border border-white/10 bg-black/18 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]">
              Degats {result.damage}
            </span>
            <span className="rounded-full border border-white/10 bg-black/18 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]">
              {isGameOver ? "Partie terminee" : "Pret pour la suite"}
            </span>
          </div>
          <div className="mt-6 flex justify-center gap-3">
            {isGameOver ? (
              <button
                className="rounded-full border border-white/10 bg-slate-950/75 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-100"
                onClick={onReset}
                type="button"
              >
                Nouvelle partie
              </button>
            ) : (
              <button
                className="rounded-full border border-white/10 bg-slate-950/75 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-100"
                onClick={onAdvance}
                type="button"
              >
                Round suivant
              </button>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
