import { useEffect, useRef, useState } from "react";
import type { Look } from "@/types/look";
import { createMindARFaceSession } from "@/lib/ar/mindar-face";

type FaceTryOnProps = {
  look: Look;
};

export function FaceTryOn({ look }: FaceTryOnProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "running" | "error">(
    "idle",
  );

  useEffect(() => {
    let stopped = false;
    let session: ReturnType<typeof createMindARFaceSession> | null = null;

    async function start() {
      if (!containerRef.current) return;
      setStatus("starting");
      try {
        session = createMindARFaceSession({ container: containerRef.current });
        await session.start();
        if (stopped) return;
        setStatus("running");
        // Placeholder: bind look.overlayAsset to face anchor once MindAR is wired.
      } catch {
        if (stopped) return;
        setStatus("error");
      }
    }

    start();
    return () => {
      stopped = true;
      session?.stop();
    };
  }, [look.id]);

  return (
    <div className="relative h-[78vh] w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-sm text-white/80">
        {status === "starting" ? "Starting face try-on…" : null}
        {status === "running" ? `Trying: ${look.name}` : null}
        {status === "error" ? "Couldn’t start face tracking." : null}
      </div>
    </div>
  );
}

