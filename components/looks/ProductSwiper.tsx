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

      {/* Background */}
      <div className="absolute inset-0 transition-all duration-700" style={{ background: product.gradient }} />
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]" aria-hidden="true">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* Arrows */}
      <button onClick={prev} aria-label="Previous look"
        className="absolute left-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white backdrop-blur-sm">‹</button>
      <button onClick={next} aria-label="Next look"
        className="absolute right-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white backdrop-blur-sm">›</button>

      {/* Main content — centred column, space between card and button */}
      <div
        className="relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-between px-8"
        style={{ paddingTop: "7dvh", paddingBottom: "max(28px, env(safe-area-inset-bottom, 28px))" }}
      >

        {/* Card + labels */}
        <div className="flex w-full flex-col items-center gap-4">

          {/* Glass card */}
          <div
            className="relative overflow-hidden rounded-[22px] border-2 border-white/70 shadow-[0_0_50px_rgba(0,0,0,0.55)]"
            style={{ height: "min(370px,47dvh)", width: "calc(min(370px,47dvh) * 291 / 401)" }}
          >
            {/* Crisp product image — absolutely fills the card, centred */}
            <Image
              key={product.imagePath}
              src={product.imagePath}
              alt={product.name}
              fill
              priority
              className="object-contain object-center"
            />
            {/* Corner sheen only — no blur */}
            <div
              className="pointer-events-none absolute inset-0 rounded-[22px]"
              style={{ background: "radial-gradient(ellipse at 10% 10%, rgba(255,255,255,0.10) 0%, transparent 55%)" }}
            />
          </div>

          {/* Season + name — both centred */}
          <div className="flex flex-col items-center gap-0.5 text-center">
            <p
              className="text-[12px] tracking-[0.1em] text-white/55"
              style={{ fontFamily: "var(--font-hanken), sans-serif" }}
            >
              {product.season}
            </p>
            <p
              className="text-[26px] font-bold leading-tight tracking-[-0.3px] text-white"
              style={{ fontFamily: "var(--font-bricolage), sans-serif" }}
            >
              {product.name}
            </p>
          </div>
        </div>

        {/* Dots + button */}
        <div className="flex w-full flex-col items-center gap-5">
          <div className="flex gap-2">
            {PRODUCTS.map((_, i) => (
              <button key={i} onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/40"}`} />
            ))}
          </div>

          <button
            onClick={() => onTryLook(product.id)}
            className="flex h-14 w-full items-center justify-center rounded-xl border border-white/60 bg-white/10 backdrop-blur-[39px] transition-transform active:scale-[0.97]"
          >
            <span
              className="text-[20px] font-bold tracking-wide text-white"
              style={{ fontFamily: "var(--font-hanken), sans-serif" }}
            >
              Try this look
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
