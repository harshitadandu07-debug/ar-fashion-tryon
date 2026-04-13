// components/ar/ThreeARRenderer.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@/components/ui/ProductCard";
import { usePoseTorso } from "@/components/ar/usePoseTorso";
import { useGarmentScene } from "@/components/ar/useGarmentScene";
import { getGarmentConfig } from "@/components/ar/garmentConfig";

const CONFIDENCE_THRESHOLD = 0.55;

type Props = {
  videoRef:  React.RefObject<HTMLVideoElement | null>;
  product:   Product;
  onStatus:  (status: string) => void;
};

export default function ThreeARRenderer({ videoRef, product, onStatus }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onStatusRef = useRef(onStatus);
  useEffect(() => { onStatusRef.current = onStatus; }, [onStatus]);
  const stableStatus = useCallback((s: string) => onStatusRef.current(s), []);
  const noopSwipe    = useCallback(() => {}, []);

  const { torso, confidence } = usePoseTorso(videoRef, noopSwipe, stableStatus);

  const torsoRef      = useRef(torso);
  const confidenceRef = useRef(confidence);
  useEffect(() => { torsoRef.current      = torso;      }, [torso]);
  useEffect(() => { confidenceRef.current = confidence; }, [confidence]);

  const [showGuidance, setShowGuidance] = useState(true);
  useEffect(() => { setShowGuidance(confidence < CONFIDENCE_THRESHOLD); }, [confidence]);

  const { threeCanvasRef, updateScene } = useGarmentScene();

  const productRef = useRef(product);
  useEffect(() => { productRef.current = product; }, [product]);

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
        updateScene(torsoRef.current, config, W, H, confidenceRef.current);

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
