// components/ar/TryOnRenderer.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@/components/ui/ProductCard";
import { usePoseTorso } from "@/components/ar/usePoseTorso";
import { drawGarmentAffine, removeWhiteBackground } from "@/components/ar/canvasWarp";
import { getGarmentConfig } from "@/components/ar/garmentConfig";

const CONFIDENCE_THRESHOLD = 0.55;

type Props = {
  videoRef:       React.RefObject<HTMLVideoElement | null>;
  products:       Product[];
  activeIndex:    number;
  onSwipe:        (dir: "left" | "right") => void;
  onStatus:       (status: string) => void;
  adjustOffset:   { x: number; y: number };
  isAdjustMode:   boolean;
  showFirstGuide: boolean;
  onDrag:         (dx: number, dy: number) => void;
  onFirstOverlay: () => void;
};

export default function TryOnRenderer({
  videoRef, products, activeIndex, onSwipe, onStatus,
  adjustOffset, isAdjustMode, showFirstGuide, onDrag, onFirstOverlay,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Stable callback refs so usePoseTorso never re-mounts
  const onSwipeRef  = useRef(onSwipe);
  const onStatusRef = useRef(onStatus);
  useEffect(() => { onSwipeRef.current  = onSwipe;  }, [onSwipe]);
  useEffect(() => { onStatusRef.current = onStatus; }, [onStatus]);
  const stableSwipe  = useCallback((d: "left" | "right") => onSwipeRef.current(d), []);
  const stableStatus = useCallback((s: string)            => onStatusRef.current(s), []);

  const adjustOffsetRef          = useRef(adjustOffset);
  const onDragRef                = useRef(onDrag);
  const onFirstOverlayRef        = useRef(onFirstOverlay);
  const hasTriggeredFirstOverlay = useRef(false);
  const lastTouchRef             = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { adjustOffsetRef.current       = adjustOffset;   }, [adjustOffset]);
  useEffect(() => { onDragRef.current             = onDrag;         }, [onDrag]);
  useEffect(() => { onFirstOverlayRef.current     = onFirstOverlay; }, [onFirstOverlay]);
  // Reset first-overlay trigger when the active outfit changes
  useEffect(() => { hasTriggeredFirstOverlay.current = false; },       [activeIndex]);

  const { torso, confidence, segMaskRef } = usePoseTorso(videoRef, stableSwipe, stableStatus);

  // Keep torso + confidence in refs for RAF loop
  const torsoRef      = useRef(torso);
  const confidenceRef = useRef(confidence);
  useEffect(() => { torsoRef.current      = torso;      }, [torso]);
  useEffect(() => { confidenceRef.current = confidence; }, [confidence]);

  // Garment image (white-bg removed) for the active product
  const garmentRef        = useRef<OffscreenCanvas | null>(null);
  const activeIndexRef    = useRef(activeIndex);
  const productsRef       = useRef(products);
  const [showGuidance, setShowGuidance] = useState(true);

  // Fire onFirstOverlay once per outfit when confidence crosses threshold and garment is loaded
  // garmentRef intentionally omitted from deps — it's a ref and mutating .current
  // doesn't trigger re-renders. The garment-load .then() path handles the race
  // condition where garment loads after confidence is already above threshold.
  useEffect(() => {
    if (
      confidence >= CONFIDENCE_THRESHOLD &&
      garmentRef.current !== null &&
      !hasTriggeredFirstOverlay.current
    ) {
      hasTriggeredFirstOverlay.current = true;
      onFirstOverlayRef.current();
    }
  }, [confidence]);

  // Update guidance visibility based on confidence
  useEffect(() => {
    setShowGuidance(confidence < CONFIDENCE_THRESHOLD);
  }, [confidence]);

  // Sync products ref for RAF loop
  useEffect(() => { productsRef.current = products; }, [products]);

  // Load + process garment image whenever active product changes
  useEffect(() => {
    activeIndexRef.current = activeIndex;
    const product = products[activeIndex];
    if (!product) { garmentRef.current = null; return; }

    const config = getGarmentConfig(product.id);
    const src    = config?.overlayAsset ?? product.overlayAsset ?? product.image;
    if (!src) { garmentRef.current = null; return; }

    // Skip try-on render for non-upper-body items
    if (config?.category !== "upper-body") {
      garmentRef.current = null;
      return;
    }

    removeWhiteBackground(src).then((offscreen) => {
      if (activeIndexRef.current === activeIndex) {
        garmentRef.current = offscreen;
        // Trigger guide if confidence was already above threshold when garment loaded
        if (
          offscreen !== null &&
          confidenceRef.current >= CONFIDENCE_THRESHOLD &&
          !hasTriggeredFirstOverlay.current
        ) {
          hasTriggeredFirstOverlay.current = true;
          onFirstOverlayRef.current();
        }
      }
    });
  }, [activeIndex, products]);

  // RAF render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;

    let rafId: number;
    // Offscreen canvas reused each frame for person-over-garment compositing
    let personCanvas: OffscreenCanvas | null = null;
    let personCtx: OffscreenCanvasRenderingContext2D | null = null;

    function render() {
      if (!canvas || !video) return;

      if (video.readyState >= 2 && video.videoWidth > 0) {
        const W = video.videoWidth;
        const H = video.videoHeight;

        if (canvas.width !== W || canvas.height !== H) {
          canvas.width  = W;
          canvas.height = H;
          personCanvas  = null; // reset offscreen on resize
        }

        const ctx = canvas.getContext("2d")!;

        // 1. Draw mirrored video
        ctx.save();
        ctx.translate(W, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, W, H);
        ctx.restore();

        // 2. Draw garment (upper-body only, confidence threshold met)
        const currentTorso = torsoRef.current;
        const currentConf  = confidenceRef.current;
        const garment      = garmentRef.current;
        const product      = productsRef.current[activeIndexRef.current];
        const config       = product ? getGarmentConfig(product.id) : null;

        if (
          garment && currentTorso && config &&
          (config.category === "upper-body" || config.category === "full-body") &&
          currentConf >= CONFIDENCE_THRESHOLD
        ) {
          const garmentAlpha = Math.min(1, (currentConf - CONFIDENCE_THRESHOLD) / 0.15 + 0.7);
          drawGarmentAffine(ctx, garment, currentTorso, config.calibration, W, H, garmentAlpha, adjustOffsetRef.current);
        }
      }

      rafId = requestAnimationFrame(render);
    }

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  // videoRef is stable; products/segMaskRef accessed via refs inside loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !lastTouchRef.current) return;
    const touch  = e.touches[0];
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const dx = (touch.clientX - lastTouchRef.current.x) * scaleX;
    const dy = (touch.clientY - lastTouchRef.current.y) * scaleY;
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    onDragRef.current(dx, dy);
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastTouchRef.current = null;
  }, []);

  return (
    <>
      {/* Canvas — renders video + garment + person overlay */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />

      {/* Touch-capture layer — active during adjust mode or first guide */}
      {(isAdjustMode || showFirstGuide) && (
        <div
          className="absolute inset-0 z-20"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
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
                  <span className="text-xs font-semibold text-white">Drag to adjust fit</span>
                </div>
                <span className="text-[10px] text-white/45">Dismisses automatically</span>
              </div>
            </div>
          )}

          {isAdjustMode && !showFirstGuide && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 backdrop-blur-sm pointer-events-none">
              <span className="text-xs text-white/80">Drag to reposition</span>
            </div>
          )}
        </div>
      )}

      {/* Guidance overlay — shown when pose not stable */}
      {showGuidance && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="rounded-2xl bg-black/50 px-5 py-4 text-center backdrop-blur-sm max-w-xs">
            <p className="text-sm font-semibold text-white mb-1">Position yourself</p>
            <ul className="text-xs text-white/70 space-y-1 text-left list-none">
              <li>• Stand straight, face the camera</li>
              <li>• Keep your upper body visible</li>
              <li>• Step back until shoulders are in frame</li>
              <li>• Keep arms slightly away from body</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
