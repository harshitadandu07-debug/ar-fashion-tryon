// components/ar/CameraView.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSwipeable } from "react-swipeable";
import ProductCard, { type Product } from "@/components/ui/ProductCard";
import TryOnRenderer from "@/components/ar/TryOnRenderer";
import { getCurrentSeason } from "@/lib/season";
import springData from "@/data/seasons/spring.json";
import summerData from "@/data/seasons/summer.json";
import fallData   from "@/data/seasons/fall.json";
import winterData from "@/data/seasons/winter.json";

const SEASON_DATA = {
  spring: springData,
  summer: summerData,
  fall:   fallData,
  winter: winterData,
};

type PermissionState = "idle" | "requesting" | "granted" | "denied";

export default function CameraView() {
  const products = useMemo<Product[]>(() => {
    const data = SEASON_DATA[getCurrentSeason()];
    return data.trends.map((t) => ({
      id:           t.id,
      category:     t.category,
      name:         t.name,
      description:  t.description,
      price:        t.price,
      image:        t.imagePath,
      overlayAsset: (t as any).overlayAsset,
    }));
  }, []);

  const videoRef  = useRef<HTMLVideoElement>(null);
  const cardsRef  = useRef<HTMLDivElement>(null);

  const [permission, setPermission]   = useState<PermissionState>("idle");
  const [facingMode, setFacingMode]   = useState<"environment" | "user">("user");
  const [gestureHint, setGestureHint] = useState<"left" | "right" | null>(null);
  const [mpStatus, setMpStatus]       = useState<string>("Waiting for MediaPipe…");
  const [activeIndex, setActiveIndex] = useState(0);

  const streamRef       = useRef<MediaStream | null>(null);
  const gestureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIndexRef  = useRef(0);
  useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);

  const scrollCards = useCallback((direction: "left" | "right") => {
    const container = cardsRef.current;
    if (!container) return;
    container.scrollBy({
      left: direction === "right" ? container.offsetWidth : -container.offsetWidth,
      behavior: "smooth",
    });
  }, []);

  const handleHandSwipe = useCallback((direction: "left" | "right") => {
    scrollCards(direction);
    if (gestureTimerRef.current) clearTimeout(gestureTimerRef.current);
    setGestureHint(direction);
    gestureTimerRef.current = setTimeout(() => setGestureHint(null), 600);
  }, [scrollCards]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft:         () => scrollCards("right"),
    onSwipedRight:        () => scrollCards("left"),
    delta:                30,
    preventScrollOnSwipe: true,
    trackTouch:           true,
  });

  // Track which card is centred
  useEffect(() => {
    if (permission !== "granted") return;
    const container = cardsRef.current;
    if (!container) return;
    function onScroll() {
      if (!container) return;
      const idx = Math.round(container.scrollLeft / container.offsetWidth);
      setActiveIndex(Math.max(0, Math.min(idx, products.length - 1)));
    }
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [permission, products.length]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (gestureTimerRef.current) clearTimeout(gestureTimerRef.current);
    };
  }, []);

  async function startCamera(facing: "environment" | "user") {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing },
      audio: false,
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }

  async function requestPermission() {
    setPermission("requesting");
    try {
      await startCamera(facingMode);
      setPermission("granted");
    } catch {
      setPermission("denied");
    }
  }

  async function toggleCamera() {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    await startCamera(next);
  }

  // ── Permission screens ──────────────────────────────────────
  if (permission === "idle" || permission === "requesting") {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-black px-6 text-white">
        <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-white/10" />
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
          </div>
        </div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/40">Double Take</p>
        <h2 className="mb-3 text-2xl font-semibold">Enable your camera</h2>
        <p className="mb-10 text-center text-sm leading-relaxed text-white/60">
          We need camera access to show AR try-on looks live on your body.
          Your feed never leaves your device.
        </p>
        <button
          onClick={requestPermission}
          disabled={permission === "requesting"}
          className="w-full max-w-xs rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-black transition-opacity disabled:opacity-50"
        >
          {permission === "requesting" ? "Starting camera…" : "Allow camera"}
        </button>
        <a href="/" className="mt-5 text-sm text-white/40 underline underline-offset-4">Go back</a>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-black px-6 text-white">
        <h2 className="mb-2 text-2xl font-semibold">Camera blocked</h2>
        <p className="mb-6 text-center text-sm text-white/60">Allow camera access in your browser settings and reload the page.</p>
        <a href="/" className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black">Go back</a>
      </div>
    );
  }

  // ── Active AR session ────────────────────────────────────────
  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* Hidden video — feeds MediaPipe and TryOnRenderer */}
      <video ref={videoRef} autoPlay playsInline muted className="absolute opacity-0 pointer-events-none" />

      {/* TryOnRenderer — canvas + guidance overlay */}
      <TryOnRenderer
        videoRef={videoRef}
        products={products}
        activeIndex={activeIndex}
        onSwipe={handleHandSwipe}
        onStatus={setMpStatus}
      />

      {/* MediaPipe status pill */}
      <div className="absolute left-4 top-4 z-20 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur-sm max-w-[60vw] truncate">
        {mpStatus}
      </div>

      {/* Flip camera button */}
      <button
        onClick={toggleCamera}
        className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm"
        aria-label="Flip camera"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      </button>

      {/* Product cards */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-4">
        {gestureHint && (
          <div className="mb-2 flex justify-center">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs text-white backdrop-blur-sm">
              {gestureHint === "left" ? "← Swipe" : "Swipe →"}
            </span>
          </div>
        )}

        <div className="mb-2 flex items-center justify-between px-4">
          <button onClick={() => scrollCards("left")}  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm" aria-label="Previous">‹</button>
          <button onClick={() => scrollCards("right")} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm" aria-label="Next">›</button>
        </div>

        <div {...swipeHandlers} className="w-full">
          <div ref={cardsRef} className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
            {products.map((product) => (
              <div key={product.id} className="w-full flex-shrink-0 snap-center flex justify-center px-6">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
