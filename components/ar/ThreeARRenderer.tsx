// components/ar/ThreeARRenderer.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

export default function ThreeARRenderer({
  videoRef, product, onStatus,
  adjustOffset, isAdjustMode, showFirstGuide, onDrag, onFirstOverlay,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onStatusRef = useRef(onStatus);
  useEffect(() => { onStatusRef.current = onStatus; }, [onStatus]);
  const stableStatus = useCallback((s: string) => onStatusRef.current(s), []);
  const noopSwipe    = useCallback(() => {}, []);

  const adjustOffsetRef          = useRef(adjustOffset);
  const onDragRef                = useRef(onDrag);
  const onFirstOverlayRef        = useRef(onFirstOverlay);
  const hasTriggeredFirstOverlay = useRef(false);
  const isAdjustModeRef  = useRef(isAdjustMode);
  const wristBaselineRef = useRef<{ lWrist: TorsoPoint; rWrist: TorsoPoint } | null>(null);
  const prevWristRef     = useRef<TorsoPoint | null>(null);

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

  // Snapshot wrist baseline when adjust mode activates; clear refs on deactivation
  useEffect(() => {
    isAdjustModeRef.current = isAdjustMode;
    if (isAdjustMode) {
      const t = torsoRef.current;
      if (t?.lWrist && t?.rWrist) {
        wristBaselineRef.current = { lWrist: t.lWrist, rWrist: t.rWrist };
      }
      prevWristRef.current = null;
    } else {
      wristBaselineRef.current = null;
      prevWristRef.current     = null;
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
        const t = torsoRef.current;
        // Capture baseline lazily if wrists weren't visible when adjust mode activated
        if (isAdjustModeRef.current && !wristBaselineRef.current && t?.lWrist && t?.rWrist) {
          wristBaselineRef.current = { lWrist: t.lWrist, rWrist: t.rWrist };
        }
        const baseline = wristBaselineRef.current;
        if (
          isAdjustModeRef.current &&
          baseline &&
          t?.lWrist &&
          t?.rWrist
        ) {
          const { lWrist, rWrist } = t;
          const lDist = Math.hypot(
            lWrist.x - baseline.lWrist.x,
            lWrist.y - baseline.lWrist.y,
          );
          const rDist = Math.hypot(
            rWrist.x - baseline.rWrist.x,
            rWrist.y - baseline.rWrist.y,
          );
          const dominant     = lDist > rDist ? lWrist : rWrist;
          const dominantBase = lDist > rDist ? baseline.lWrist : baseline.rWrist;
          const totalDisp    = Math.hypot(
            dominant.x - dominantBase.x,
            dominant.y - dominantBase.y,
          );

          if (totalDisp < WRIST_DEADZONE) {
            // Inside deadzone — reset prev so no jump when user re-engages
            prevWristRef.current = null;
          } else {
            const prev = prevWristRef.current;
            if (prev) {
              // Negate x: mirrored video — physical right = MediaPipe x-decrease = screen right
              const dx = -(dominant.x - prev.x) * W;
              const dy =  (dominant.y - prev.y) * H;
              onDragRef.current(dx, dy);
            }
            prevWristRef.current = dominant;
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
                <div className="flex items-center gap-4">
                  <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <polyline points="15,18 9,12 15,6" />
                  </svg>
                  <div className="flex flex-col items-center gap-2">
                    <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <polyline points="18,15 12,9 6,15" />
                    </svg>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#6366f1">
                        <path d="M9 11.24V7.5a2.5 2.5 0 015 0v3.74c1.21-.81 2-2.18 2-3.74a4 4 0 00-8 0c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6.5a1.5 1.5 0 00-3 0V14l-3.12-.65a.5.5 0 00-.48.13l-.7.71 4.5 4.68A4.98 4.98 0 0014 21h3.73a1 1 0 00.98-.8l.67-3.48a1 1 0 00-.54-1.05z"/>
                      </svg>
                    </div>
                    <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <polyline points="6,9 12,15 18,9" />
                    </svg>
                  </div>
                  <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                </div>
                <div className="rounded-full bg-black/60 px-4 py-1.5 backdrop-blur-sm">
                  <span className="text-xs font-semibold text-white">Move your arm to adjust</span>
                </div>
                <span className="text-[10px] text-white/45">Dismisses automatically</span>
              </div>
            </div>
          )}

          {isAdjustMode && !showFirstGuide && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 backdrop-blur-sm pointer-events-none">
              <span className="text-xs text-white/80">Move your arm to reposition</span>
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
}
