"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProductCard, { type Product } from "@/components/ui/ProductCard";
import { getCurrentSeason } from "@/lib/season";
import springData from "@/data/seasons/spring.json";
import summerData from "@/data/seasons/summer.json";
import fallData from "@/data/seasons/fall.json";
import winterData from "@/data/seasons/winter.json";

const SEASON_DATA = {
  spring: springData,
  summer: summerData,
  fall: fallData,
  winter: winterData,
};

type PermissionState = "idle" | "requesting" | "granted" | "denied";

export default function CameraView() {
  const products = useMemo<Product[]>(() => {
    const data = SEASON_DATA[getCurrentSeason()];
    return data.trends.map((t) => ({
      id: t.id,
      category: t.category,
      name: t.name,
      description: t.description,
      price: t.price,
      image: t.imagePath,
    }));
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [permission, setPermission] = useState<PermissionState>("idle");
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "user"
  );
  const streamRef = useRef<MediaStream | null>(null);

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

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (permission === "idle" || permission === "requesting") {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-black px-6 text-white">
        {/* Animated camera ring */}
        <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-white/10" />
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
            <svg
              className="h-10 w-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
              />
            </svg>
          </div>
        </div>

        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/40">
          Double Take
        </p>
        <h2 className="mb-3 text-2xl font-semibold">Enable your camera</h2>
        <p className="mb-10 text-center text-sm leading-relaxed text-white/60">
          We need camera access to show AR try-on looks live on your face.
          Your feed never leaves your device.
        </p>

        <button
          onClick={requestPermission}
          disabled={permission === "requesting"}
          className="w-full max-w-xs rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-black transition-opacity disabled:opacity-50"
        >
          {permission === "requesting" ? "Starting camera…" : "Allow camera"}
        </button>

        <a
          href="/"
          className="mt-5 text-sm text-white/40 underline underline-offset-4"
        >
          Go back
        </a>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-black px-6 text-white">
        <h2 className="mb-2 text-2xl font-semibold">Camera blocked</h2>
        <p className="mb-6 text-center text-sm text-white/60">
          Allow camera access in your browser settings and reload the page.
        </p>
        <a
          href="/"
          className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black"
        >
          Go back
        </a>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* Camera feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Flip camera button */}
      <button
        onClick={toggleCamera}
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm"
        aria-label="Flip camera"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      </button>

      {/* Product cards — horizontal scroll */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-4">
        <div className="flex gap-6 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
          {products.map((product) => (
            <div key={product.id} className="snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
