// components/ar/ThreeARRenderer.tsx
"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import type { Product } from "@/components/ui/ProductCard";
import { usePoseTorso } from "@/components/ar/usePoseTorso";
import type { TorsoPoint } from "@/components/ar/usePoseTorso";
import { useGarmentScene } from "@/components/ar/useGarmentScene";
import { getGarmentConfig } from "@/components/ar/garmentConfig";

const CONFIDENCE_THRESHOLD = 0.55;
const WRIST_DEADZONE       = 0.025; // normalised units — 2.5% of frame width filters body sway

type Props = {
  videoRef:       React.RefObject<HTMLVideoElement | null>;
  product:        Product;
  onStatus:       (status: string) => void;
  adjustOffset:   { x: number; y: number };
  isAdjustMode:   boolean;
  showFirstGuide: boolean;
  onDrag:         (dx: number, dy: number) => void;
  onFirstOverlay: () => void;
};

export type ThreeARRendererHandle = {
  captureFrame: () => HTMLCanvasElement | null;
};

const ThreeARRenderer = forwardRef<ThreeARRendererHandle, Props>(function ThreeARRenderer({
  videoRef, product, onStatus,
  adjustOffset, isAdjustMode, showFirstGuide, onDrag, onFirstOverlay,
}, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    captureFrame: () => canvasRef.current,
  }));

  const onStatusRef = useRef(onStatus);
  useEffect(() => { onStatusRef.current = onStatus; }, [onStatus]);
  const stableStatus = useCallback((s: string) => onStatusRef.current(s), []);
  const noopSwipe    = useCallback(() => {}, []);

  const adjustOffsetRef          = useRef(adjustOffset);
  const onDragRef                = useRef(onDrag);
  const onFirstOverlayRef        = useRef(onFirstOverlay);
  const hasTriggeredFirstOverlay = useRef(false);
  const isAdjustModeRef = useRef(isAdjustMode);
  const lockedWristRef  = useRef<"l" | "r" | null>(null);
  const prevWristRef    = useRef<TorsoPoint | null>(null);

  useEffect(() => { adjustOffsetRef.current       = adjustOffset;   }, [adjustOffset]);
  useEffect(() => { onDragRef.current             = onDrag;         }, [onDrag]);
  useEffect(() => { onFirstOverlayRef.current     = onFirstOverlay; }, [onFirstOverlay]);
  // Reset first-overlay trigger when product changes
  useEffect(() => { hasTriggeredFirstOverlay.current = false; }, [product]);


  const { torso, confidence } = usePoseTorso(videoRef, noopSwipe, stableStatus);

  const torsoRef      = useRef(torso);
  const confidenceRef = useRef(confidence);
  useEffect(() => { torsoRef.current      = torso;      }, [torso]);
  useEffect(() => { confidenceRef.current = confidence; }, [confidence]);

  useEffect(() => {
    isAdjustModeRef.current = isAdjustMode;
    if (!isAdjustMode) {
      lockedWristRef.current = null;
      prevWristRef.current   = null;
    }
  }, [isAdjustMode]);

  const [showGuidance, setShowGuidance] = useState(true);
  useEffect(() => { setShowGuidance(confidence < CONFIDENCE_THRESHOLD); }, [confidence]);

  const { threeCanvasRef, updateScene, hasGarmentRef } = useGarmentScene();

  const productRef = useRef(product);
  useEffect(() => { productRef.current = product; }, [product]);

  // Fire onFirstOverlay once per product when confidence crosses threshold and garment is loaded.
  // hasGarmentRef intentionally omitted from deps — it's a ref; the RAF loop path below handles
  // the race where garment loads after confidence is already high.
  useEffect(() => {
    if (
      confidence >= CONFIDENCE_THRESHOLD &&
      hasGarmentRef.current &&
      !hasTriggeredFirstOverlay.current
    ) {
      hasTriggeredFirstOverlay.current = true;
      onFirstOverlayRef.current();
    }
  }, [confidence]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;

    let rafId: number;

    function render() {
      if (!canvas || !video) { rafId = requestAnimationFrame(render); return; }

      if (video.readyState >= 2 && video.videoWidth > 0) {
        const W = video.videoWidth;
        const H = video.videoHeight;

        if (canvas.width !== W || canvas.height !== H) {
          canvas.width  = W;
          canvas.height = H;
        }

        const ctx = canvas.getContext("2d")!;

        // 1. Draw mirrored video
        ctx.save();
        ctx.translate(W, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, W, H);
        ctx.restore();

        // 2. Update Three.js scene
        const config = getGarmentConfig(productRef.current.id);
        updateScene(torsoRef.current, config, W, H, confidenceRef.current, adjustOffsetRef.current);

        // Trigger first-overlay guide if garment just loaded while confidence was already high
        if (
          hasGarmentRef.current &&
          confidenceRef.current >= CONFIDENCE_THRESHOLD &&
          !hasTriggeredFirstOverlay.current
        ) {
          hasTriggeredFirstOverlay.current = true;
          onFirstOverlayRef.current();
        }

        // ── Wrist tracking (adjust mode only) ─────────────────────────
        // Lock to whichever wrist is raised above its shoulder — no baseline needed,
        // works even when only one wrist is visible.
        if (isAdjustModeRef.current) {
          const torso = torsoRef.current;
          const lWrist = torso?.lWrist ?? null;
          const rWrist = torso?.rWrist ?? null;

          if (!lockedWristRef.current) {
            const lRaised = lWrist && torso && lWrist.y < torso.lShoulder.y - 0.04;
            const rRaised = rWrist && torso && rWrist.y < torso.rShoulder.y - 0.04;
            if      (lRaised) { lockedWristRef.current = "l"; prevWristRef.current = null; }
            else if (rRaised) { lockedWristRef.current = "r"; prevWristRef.current = null; }
          }

          const locked   = lockedWristRef.current;
          const dominant = locked === "l" ? lWrist : locked === "r" ? rWrist : null;

          if (locked && dominant) {
            const prev = prevWristRef.current;
            if (prev) {
              onDragRef.current(
                (dominant.x - prev.x) * W,
                (dominant.y - prev.y) * H,
              );
            }
            prevWristRef.current = dominant;
          } else {
            prevWristRef.current = null;
          }
        }

        // 3. Composite Three.js canvas on top
        const threeCanvas = threeCanvasRef.current;
        if (threeCanvas && threeCanvas.width > 0) {
          ctx.drawImage(threeCanvas, 0, 0, W, H);
        }
      }

      rafId = requestAnimationFrame(render);
    }

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateScene]);


  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />

      {/* Adjust mode overlay — active during adjust mode or first guide */}
      {(isAdjustMode || showFirstGuide) && (
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          aria-hidden="true"
        >
          {showFirstGuide && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-3">
                {/* Directional arrows around the hand emoji */}
                <div className="flex items-center gap-4">
                  <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <polyline points="15,18 9,12 15,6" />
                  </svg>
                  <div className="flex flex-col items-center gap-1">
                    <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <polyline points="18,15 12,9 6,15" />
                    </svg>
                    {/* Mirrored hand — matches front-camera view */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-3xl" style={{ transform: "scaleX(-1)" }}>
                      ✋
                    </div>
                    <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <polyline points="6,9 12,15 18,9" />
                    </svg>
                  </div>
                  <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {showGuidance && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="rounded-2xl bg-black/50 px-5 py-4 text-center backdrop-blur-sm max-w-xs">
            <p className="text-sm font-semibold text-white mb-1">Position yourself</p>
            <ul className="text-xs text-white/70 space-y-1 text-left list-none">
              <li>• Stand straight, face the camera</li>
              <li>• Keep your upper body visible</li>
              <li>• Step back until shoulders are in frame</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
});

export default ThreeARRenderer;
