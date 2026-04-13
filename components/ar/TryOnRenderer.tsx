// components/ar/TryOnRenderer.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@/components/ui/ProductCard";
import { usePoseTorso } from "@/components/ar/usePoseTorso";
import { drawGarmentAffine, removeWhiteBackground } from "@/components/ar/canvasWarp";
import { getGarmentConfig } from "@/components/ar/garmentConfig";

const CONFIDENCE_THRESHOLD = 0.55;

type Props = {
  videoRef:    React.RefObject<HTMLVideoElement | null>;
  products:    Product[];
  activeIndex: number;
  onSwipe:     (dir: "left" | "right") => void;
  onStatus:    (status: string) => void;
};

export default function TryOnRenderer({ videoRef, products, activeIndex, onSwipe, onStatus }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Stable callback refs so usePoseTorso never re-mounts
  const onSwipeRef  = useRef(onSwipe);
  const onStatusRef = useRef(onStatus);
  useEffect(() => { onSwipeRef.current  = onSwipe;  }, [onSwipe]);
  useEffect(() => { onStatusRef.current = onStatus; }, [onStatus]);
  const stableSwipe  = useCallback((d: "left" | "right") => onSwipeRef.current(d), []);
  const stableStatus = useCallback((s: string)            => onStatusRef.current(s), []);

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
      // Only apply if this product is still active
      if (activeIndexRef.current === activeIndex) {
        garmentRef.current = offscreen;
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

        const shouldDrawGarment =
          garment !== null &&
          currentTorso !== null &&
          config?.category === "upper-body" &&
          currentConf >= CONFIDENCE_THRESHOLD;

        // Debug: always draw landmarks when torso is detected
        if (currentTorso) {
          const { lShoulder, rShoulder, lHip, rHip, neck } = currentTorso;
          const pts = { lShoulder, rShoulder, lHip, rHip, neck };

          ctx.save();
          // Torso box
          const bx = Math.min(lShoulder.x, rShoulder.x, lHip.x, rHip.x) * W;
          const bw = (Math.max(lShoulder.x, rShoulder.x, lHip.x, rHip.x) - Math.min(lShoulder.x, rShoulder.x, lHip.x, rHip.x)) * W;
          const by = Math.min(lShoulder.y, rShoulder.y) * H;
          const bh = (Math.max(lHip.y, rHip.y) - Math.min(lShoulder.y, rShoulder.y)) * H;
          ctx.strokeStyle = "rgba(0,255,0,0.8)";
          ctx.lineWidth = 2;
          ctx.strokeRect(bx, by, bw, bh);

          // Landmarks
          Object.entries(pts).forEach(([, pt]) => {
            ctx.beginPath();
            ctx.arc(pt.x * W, pt.y * H, 6, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,0,0,0.9)";
            ctx.fill();
          });

          // Confidence
          ctx.fillStyle = "white";
          ctx.font = "14px monospace";
          ctx.fillText(`conf: ${currentConf.toFixed(2)}`, 8, H - 8);
          ctx.restore();
        }

        if (shouldDrawGarment && garment && currentTorso && config) {
          // Fade garment when confidence is borderline
          const garmentAlpha = Math.min(1, (currentConf - CONFIDENCE_THRESHOLD) / 0.15 + 0.7);
          drawGarmentAffine(ctx, garment, currentTorso, config.calibration, W, H, garmentAlpha);
        }
      }

      rafId = requestAnimationFrame(render);
    }

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  // videoRef is stable; products/segMaskRef accessed via refs inside loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Canvas — renders video + garment + person overlay */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />

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
