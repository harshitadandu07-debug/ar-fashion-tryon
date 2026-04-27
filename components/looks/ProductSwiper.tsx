"use client";

import { useState } from "react";
import Image from "next/image";
type Product = {
  id:        number;
  name:      string;
  season:    string;
  imagePath: string;
  gradient:  string;
};

const PRODUCTS: Product[] = [
  {
    id:        1,
    name:      "Mode Sportif",
    season:    "SPRING 2026",
    imagePath: "/products/product1.png",
    gradient:  "radial-gradient(ellipse at 20% 80%, #3b1f6e 0%, #0a0a14 55%), radial-gradient(ellipse at 80% 20%, #1a0f3d 0%, transparent 60%)",
  },
  {
    id:        2,
    name:      "Tiered Dresses",
    season:    "SPRING 2026",
    imagePath: "/products/product2.png",
    gradient:  "radial-gradient(ellipse at 25% 75%, #5c1a3a 0%, #0a0a14 55%), radial-gradient(ellipse at 75% 25%, #1f0d3b 0%, transparent 60%)",
  },
];

type Props = { onTryLook: (productId: number) => void };

export default function ProductSwiper({ onTryLook }: Props) {
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => (i - 1 + PRODUCTS.length) % PRODUCTS.length);
  const next = () => setIndex((i) => (i + 1) % PRODUCTS.length);

  const product = PRODUCTS[index];

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden">

      {/* Gradient + noise background */}
      <div className="absolute inset-0 transition-all duration-700" style={{ background: product.gradient }} />
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]" aria-hidden="true">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* Mid arrows — always vertically centred, never block content */}
      <button onClick={prev} aria-label="Previous look" className="absolute left-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white backdrop-blur-sm">‹</button>
      <button onClick={next} aria-label="Next look"     className="absolute right-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white backdrop-blur-sm">›</button>

      {/* ── Flex column fills the screen; button always at bottom ── */}
      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-between px-8 pt-[7%]"
           style={{ paddingBottom: "max(28px, env(safe-area-inset-bottom, 28px))" }}>

        {/* Phone mockup — height capped so it never crowds the button */}
        <div className="flex flex-col items-center">
          <div
            className="relative overflow-hidden rounded-[22px] border-2 border-white/80 shadow-[0_0_50px_rgba(0,0,0,0.55)]"
            style={{ height: "min(370px, 47dvh)", aspectRatio: "291 / 401" }}
          >
            {/* Frosted inner gradient */}
            <div className="absolute inset-0 z-10 rounded-[22px] backdrop-blur-[10px]"
                 style={{ background: "radial-gradient(ellipse at 0% 0%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)" }} />

            {/* Product image */}
            <div className="relative h-full w-full">
              <Image src={product.imagePath} alt={product.name} fill className="object-contain object-center" priority />
            </div>

            <div className="pointer-events-none absolute inset-[-2px] z-10 rounded-[inherit] shadow-[inset_-5px_-5px_250px_0px_rgba(255,255,255,0.04)]" />
          </div>

          {/* Season + name */}
          <p className="mt-4 text-[12px] tracking-[0.1em] text-white/55" style={{ fontFamily: "var(--font-hanken), sans-serif" }}>
            {product.season}
          </p>
          <p className="mt-0.5 text-[26px] font-bold leading-tight tracking-[-0.3px] text-white" style={{ fontFamily: "var(--font-bricolage), sans-serif" }}>
            {product.name}
          </p>
        </div>

        {/* ── Bottom group: dots + button ── */}
        <div className="flex w-full flex-col items-center gap-5">
          {/* Dot indicator */}
          <div className="flex gap-2">
            {PRODUCTS.map((_, i) => (
              <button key={i} onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/40"}`} />
            ))}
          </div>

          {/* EXPLORE FASHION — 56 px tall (≥ 44 px a11y min) */}
          <button
            onClick={() => onTryLook(product.id)}
            className="flex h-14 w-full items-center justify-center rounded-xl border border-white/60 bg-white/10 backdrop-blur-[39px] active:scale-[0.97] transition-transform"
          >
            <span className="text-[20px] font-bold tracking-wide text-white" style={{ fontFamily: "var(--font-hanken), sans-serif" }}>
              Try this look
            </span>
          </button>
        </div>

      </div>

    </div>
  );
}
