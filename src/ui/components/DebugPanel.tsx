import type { DebugSnapshot } from "../../game/selectors";

interface DebugPanelProps {
  snapshot: DebugSnapshot;
}

export function DebugPanel({ snapshot }: DebugPanelProps) {
  return (
    <section className="w-36 rounded-[0.95rem] border border-white/8 bg-slate-950/40 p-2 text-[9px] text-white/56 shadow-[0_10px_20px_rgba(0,0,0,0.18)] backdrop-blur-md opacity-20 transition hover:opacity-45">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold uppercase tracking-[0.16em] text-white/58">Debug</p>
        <span className="text-[8px] uppercase tracking-[0.14em] text-white/42">dev</span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1">
        <div className="rounded-[0.75rem] border border-white/6 bg-white/[0.04] px-2 py-1">
          <p className="uppercase tracking-[0.12em] text-white/36">Phase</p>
          <p className="mt-0.5">{snapshot.phase}</p>
        </div>
        <div className="rounded-[0.75rem] border border-white/6 bg-white/[0.04] px-2 py-1">
          <p className="uppercase tracking-[0.12em] text-white/36">Round</p>
          <p className="mt-0.5">{snapshot.roundLabel}</p>
        </div>
        <div className="rounded-[0.75rem] border border-white/6 bg-white/[0.04] px-2 py-1">
          <p className="uppercase tracking-[0.12em] text-white/36">Tick</p>
          <p className="mt-0.5">{snapshot.combatElapsedMs} ms</p>
        </div>
        <div className="rounded-[0.75rem] border border-white/6 bg-white/[0.04] px-2 py-1">
          <p className="uppercase tracking-[0.12em] text-white/36">Board</p>
          <p className="mt-0.5">
            {snapshot.homeUnits}/{snapshot.awayUnits}
          </p>
        </div>
      </div>
    </section>
  );
}
