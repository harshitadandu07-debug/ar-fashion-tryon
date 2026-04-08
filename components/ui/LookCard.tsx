import type { Look } from "@/types/look";

type LookCardProps = {
  look: Look;
  active?: boolean;
  onSelect?: () => void;
};

export function LookCard({ look, active, onSelect }: LookCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "w-[82vw] max-w-sm shrink-0 rounded-2xl border p-4 text-left transition",
        "bg-zinc-950/80 backdrop-blur",
        active ? "border-white/30" : "border-white/10",
      ].join(" ")}
      aria-pressed={active}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-white">{look.name}</div>
          <div className="mt-1 text-sm text-white/70">{look.description}</div>
        </div>
        <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-xs font-semibold text-white/80">
          Spring 2026
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-white">Try this look</span>
        <span className="text-white/70">→</span>
      </div>
    </button>
  );
}

