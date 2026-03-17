import clsx from "clsx";
import type { MessageLogEntry } from "../../types/gameTypes";

interface FeedbackToastProps {
  entry: MessageLogEntry | null;
}

export function FeedbackToast({ entry }: FeedbackToastProps) {
  if (!entry) {
    return null;
  }

  const toneClass =
    entry.tone === "success"
      ? "border-emerald-300/30 bg-[linear-gradient(180deg,rgba(13,58,52,0.95)_0%,rgba(8,27,25,0.95)_100%)] text-emerald-50"
      : entry.tone === "warning"
        ? "border-orange-300/30 bg-[linear-gradient(180deg,rgba(73,28,24,0.95)_0%,rgba(37,14,12,0.95)_100%)] text-orange-50"
        : entry.tone === "combat"
          ? "border-cyan-300/30 bg-[linear-gradient(180deg,rgba(13,41,59,0.95)_0%,rgba(8,17,29,0.95)_100%)] text-cyan-50"
          : "border-white/12 bg-[linear-gradient(180deg,rgba(20,29,45,0.95)_0%,rgba(10,16,28,0.95)_100%)] text-slate-100";

  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 z-20 flex justify-center px-4">
      <div
        className={clsx(
          "result-pop rounded-full border px-4 py-2 text-sm font-semibold shadow-[0_20px_40px_rgba(0,0,0,0.32)] backdrop-blur",
          toneClass,
        )}
      >
        {entry.text}
      </div>
    </div>
  );
}
