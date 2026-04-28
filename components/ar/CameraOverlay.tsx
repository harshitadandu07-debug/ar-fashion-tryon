"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ThreeARRenderer, { type ThreeARRendererHandle } from "@/components/ar/ThreeARRenderer";
import { useFistDetector } from "@/components/ar/useFistDetector";
import type { Product } from "@/components/ui/ProductCard";

const PERMISSION_KEY = "dt_camera_permission_granted";

type Props = {
  product: Product;
  onClose: () => void;
};

type CameraState = "checking" | "requesting" | "granted" | "denied";

export default function CameraOverlay({ product, onClose }: Props) {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const rendererRef   = useRef<ThreeARRendererHandle>(null);

  const [cameraState, setCameraState] = useState<CameraState>("checking");

  const [adjustOffset,           setAdjustOffset]           = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isAdjustMode,           setIsAdjustMode]           = useState(false);
  const [showFirstGuide,         setShowFirstGuide]         = useState(false);
  const [firstGuideHasBeenShown, setFirstGuideHasBeenShown] = useState(false);
  const [lockedToast,  setLockedToast] = useState(false);
  const toastTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lazily load MediaPipe Hands CDN (for fist detection) only while overlay is open
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).Hands) return; // already loaded
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
    s.crossOrigin = "anonymous";
    document.head.appendChild(s);
    return () => { try { document.head.removeChild(s); } catch {} };
  }, []);

  // Camera permission / stream
  useEffect(() => {
    const alreadyGranted = localStorage.getItem(PERMISSION_KEY) === "true";
    if (alreadyGranted) startCamera();
    else setCameraState("requesting");
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCamera() {
    setCameraState("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      localStorage.setItem(PERMISSION_KEY, "true");
      setCameraState("granted");
    } catch {
      localStorage.removeItem(PERMISSION_KEY);
      setCameraState("denied");
    }
  }

  const handleFirstOverlay = useCallback(() => {
    setShowFirstGuide(true);
    setIsAdjustMode(true);
    setFirstGuideHasBeenShown(true);
  }, []);

  const handleDrag = useCallback((dx: number, dy: number) => {
    setAdjustOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    // Hide the guide hint once the user starts moving — adjust mode stays active
    setShowFirstGuide(false);
  }, []);

  const handleAdjustFit = useCallback(() => {
    setIsAdjustMode(true);
  }, []);

  // ── Fist gesture: lock outfit position ──────────────────────────
  const handleFistLocked = useCallback(() => {
    if (!isAdjustMode) return;
    setIsAdjustMode(false);
    setShowFirstGuide(false);

    // Capture and save the current AR frame
    const canvas = rendererRef.current?.captureFrame();
    if (canvas) {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const filename = `stylecast-${Date.now()}.png`;
        const file = new File([blob], filename, { type: "image/png" });

        if (navigator.canShare?.({ files: [file] })) {
          // Native share sheet — user can save to Photos on iOS/Android
          try {
            await navigator.share({ files: [file], title: "My StyleCast Look" });
          } catch {
            // User cancelled — that's fine
          }
        } else {
          // Fallback: trigger download
          const url = URL.createObjectURL(blob);
          const a   = document.createElement("a");
          a.href     = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
        }
      }, "image/png");
    }

    setLockedToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setLockedToast(false), 2500);
  }, [isAdjustMode]);

  useFistDetector(videoRef, handleFistLocked, isAdjustMode);

  // ── Permission screens ───────────────────────────────────────────
  if (cameraState === "requesting") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black px-6 text-white animate-in slide-in-from-bottom duration-300">
        <button onClick={onClose} className="absolute right-4 top-12 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Close">✕</button>
        <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-white/10" />
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
          </div>
        </div>
        <h2 className="mb-3 text-2xl font-semibold">Enable your camera</h2>
        <p className="mb-10 text-center text-sm leading-relaxed text-white/60">
          We need camera access to try on <span className="text-white font-medium">{product.name}</span> live on your body. Your feed never leaves your device.
        </p>
        <button onClick={startCamera} className="w-full max-w-xs rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-black">Allow camera</button>
      </div>
    );
  }

  if (cameraState === "denied") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black px-6 text-white animate-in slide-in-from-bottom duration-300">
        <button onClick={onClose} className="absolute right-4 top-12 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Close">✕</button>
        <h2 className="mb-2 text-2xl font-semibold">Camera blocked</h2>
        <p className="mb-6 text-center text-sm text-white/60">Allow camera access in your browser settings and try again.</p>
        <button onClick={startCamera} className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black">Try again</button>
      </div>
    );
  }

  // ── Live AR session ──────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black animate-in slide-in-from-bottom duration-300">
      <video ref={videoRef} autoPlay playsInline muted className="absolute opacity-0 pointer-events-none" />

      {cameraState === "granted" && (
        <ThreeARRenderer
          ref={rendererRef}
          videoRef={videoRef}
          product={product}
          onStatus={() => {}}
          adjustOffset={adjustOffset}
          isAdjustMode={isAdjustMode}
          showFirstGuide={showFirstGuide}
          onDrag={handleDrag}
          onFirstOverlay={handleFirstOverlay}
        />
      )}

      {/* Close */}
      <button onClick={onClose} className="absolute right-4 top-12 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm" aria-label="Close">✕</button>

      {/* Adjust fit button */}
      {firstGuideHasBeenShown && !showFirstGuide && !isAdjustMode && (
        <button onClick={handleAdjustFit} className="absolute left-4 top-12 z-20 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm" aria-label="Adjust outfit fit">
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
          </svg>
          <span className="text-xs font-semibold text-white">Adjust fit</span>
        </button>
      )}

      {/* Fist-lock hint — shown while in adjust mode */}
      {isAdjustMode && !showFirstGuide && (
        <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1.5 backdrop-blur-sm">
          <span className="text-xs text-white/70">✊ Close fist to lock position</span>
        </div>
      )}

      {/* "Position locked" toast */}
      {lockedToast && (
        <div className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2 rounded-full bg-white/20 px-5 py-2 backdrop-blur-md">
          <span className="text-sm font-semibold text-white">✓ Saved to gallery</span>
        </div>
      )}
    </div>
  );
}
