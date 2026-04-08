import { useEffect, useRef, useState } from "react";
import { createMindARImageSession } from "@/lib/ar/mindar-image";

type PosterTrackerProps = {
  targetSrc: string; // e.g. "/targets/poster.mind"
  onDetected: () => void;
};

export function PosterTracker({ targetSrc, onDetected }: PosterTrackerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "running" | "error">(
    "idle",
  );

  useEffect(() => {
    let stopped = false;
    let session: ReturnType<typeof createMindARImageSession> | null = null;

    async function start() {
      if (!containerRef.current) return;
      setStatus("starting");
      try {
        session = createMindARImageSession({
          container: containerRef.current,
          targetSrc,
        });
        await session.start();
        if (stopped) return;
        setStatus("running");
        // Placeholder until MindAR events are wired.
        // We'll call onDetected() when the target is found.
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
  }, [targetSrc, onDetected]);

  return (
    <div className="relative h-[70vh] w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-sm text-white/80">
        {status === "starting" ? "Starting poster scan…" : null}
        {status === "running" ? "Point at the poster to detect." : null}
        {status === "error" ? "Couldn’t start poster scan." : null}
      </div>
    </div>
  );
}

