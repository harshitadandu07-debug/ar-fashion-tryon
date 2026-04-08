type CameraPermissionProps = {
  state: "idle" | "prompting" | "granted" | "denied";
  onRequest: () => void;
};

export function CameraPermission({ state, onRequest }: CameraPermissionProps) {
  if (state === "granted") return null;

  const isDenied = state === "denied";
  const isPrompting = state === "prompting";

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-4 backdrop-blur">
      <div className="w-full rounded-2xl border border-white/10 bg-zinc-950 p-4 text-white shadow-xl">
        <div className="text-base font-semibold">
          {isDenied ? "Camera access is required" : "Enable camera to start"}
        </div>
        <div className="mt-1 text-sm text-white/70">
          {isDenied
            ? "Please allow camera access in your browser settings, then reload."
            : "We use your camera for poster detection and face try-on."}
        </div>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
            onClick={onRequest}
            disabled={isPrompting}
          >
            {isPrompting ? "Requesting…" : "Allow camera"}
          </button>
          <a
            className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/90"
            href="/"
          >
            Back
          </a>
        </div>
      </div>
    </div>
  );
}

