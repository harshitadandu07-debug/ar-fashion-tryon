type SaveShareBarProps = {
  disabled?: boolean;
  onCapture: () => void;
  onBack: () => void;
};

export function SaveShareBar({ disabled, onCapture, onBack }: SaveShareBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex gap-3 p-4">
      <button
        type="button"
        className="rounded-xl border border-white/15 bg-zinc-950/70 px-4 py-3 text-sm font-semibold text-white backdrop-blur disabled:opacity-60"
        onClick={onBack}
      >
        Back
      </button>
      <button
        type="button"
        className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
        onClick={onCapture}
        disabled={disabled}
      >
        Save / Share
      </button>
    </div>
  );
}

