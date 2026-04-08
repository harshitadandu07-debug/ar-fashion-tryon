/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Look } from "@/types/look";
import looksJson from "@/data/looks.json";
import { requestCameraPermission } from "@/lib/utils/camera";
import { CameraPermission } from "@/components/ui/CameraPermission";
import { LookCarousel } from "@/components/ui/LookCarousel";
import { PosterTracker } from "@/components/ar/PosterTracker";
import { FaceTryOn } from "@/components/ar/FaceTryOn";
import { SaveShareBar } from "@/components/ui/SaveShareBar";

type CameraPermissionState = "idle" | "prompting" | "granted" | "denied";
type Stage = "detecting" | "browsing" | "tryon";

export default function ARPage() {
  const looks = useMemo(() => looksJson as Look[], []);
  const entryMode = useMemo<"poster" | "qr">(() => {
    if (typeof window === "undefined") return "poster";
    const p = new URLSearchParams(window.location.search);
    return p.get("entry") === "qr" ? "qr" : "poster";
  }, []);

  const [cameraPermission, setCameraPermission] =
    useState<CameraPermissionState>("idle");
  const [stage, setStage] = useState<Stage>(entryMode === "qr" ? "browsing" : "detecting");
  const [posterDetected, setPosterDetected] = useState(false);
  const [selectedLookId, setSelectedLookId] = useState<string | null>(null);

  const selectedLook = useMemo(
    () => looks.find((l) => l.id === selectedLookId) ?? null,
    [looks, selectedLookId],
  );

  useEffect(() => {
    // Preflight permission to avoid “blank camera” failures.
    (async () => {
      setCameraPermission("prompting");
      const r = await requestCameraPermission();
      setCameraPermission(r === "granted" ? "granted" : "denied");
    })();
  }, []);

  function onRequestPermission() {
    (async () => {
      setCameraPermission("prompting");
      const r = await requestCameraPermission();
      setCameraPermission(r === "granted" ? "granted" : "denied");
    })();
  }

  function onDetected() {
    setPosterDetected(true);
    setStage("browsing");
  }

  return (
    <main className="min-h-dvh bg-black text-white">
      <CameraPermission state={cameraPermission} onRequest={onRequestPermission} />

      <div className="mx-auto w-full max-w-md px-4 pb-28 pt-6">
        <div className="mb-4">
          <div className="text-xs font-semibold tracking-wide text-white/60">
            DOUBLE TAKE
          </div>
          <div className="mt-1 text-lg font-semibold">
            {stage === "detecting" ? "Scan the poster" : null}
            {stage === "browsing" ? "Spring 2026 trends" : null}
            {stage === "tryon" ? "Live try-on" : null}
          </div>
          <div className="mt-1 text-sm text-white/60">
            {entryMode === "qr" ? "QR entry enabled." : "Poster entry enabled."}
            {posterDetected ? " Poster detected." : null}
          </div>
        </div>

        {stage === "detecting" ? (
          <PosterTracker targetSrc="/targets/poster.mind" onDetected={onDetected} />
        ) : null}

        {stage === "browsing" ? (
          <div className="space-y-4">
            {entryMode === "poster" && !posterDetected ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                Point at the poster to unlock the experience, or use QR fallback.
              </div>
            ) : null}
            <LookCarousel
              looks={looks}
              activeLookId={selectedLookId}
              onSelect={(id) => setSelectedLookId(id)}
            />
            <button
              type="button"
              className="w-full rounded-2xl bg-white px-5 py-4 text-center text-sm font-semibold text-black disabled:opacity-60"
              disabled={!selectedLookId}
              onClick={() => setStage("tryon")}
            >
              Try selected look
            </button>
          </div>
        ) : null}

        {stage === "tryon" && selectedLook ? <FaceTryOn look={selectedLook} /> : null}

        {stage === "tryon" ? (
          <SaveShareBar
            onBack={() => setStage("browsing")}
            onCapture={() => {
              // wired later in lib/utils/capture.ts once MindAR canvas is available
              alert("Save/Share will be wired next (canvas capture).");
            }}
          />
        ) : null}
      </div>
    </main>
  );
}

