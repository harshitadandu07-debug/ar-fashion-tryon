"use client";

import { useState } from "react";
import Image from "next/image";

type Product = {
  id:        number;
  name:      string;
  season:    string;
  imagePath: string;
  bgPath:    string;
};

const PRODUCTS: Product[] = [
  {
    id:        1,
    name:      "Mode Sportif",
    season:    "SPRING 2026",
    imagePath: "/products/product1.png",
    bgPath:    "/products/bg1.jpg",
  },
  {
    id:        2,
    name:      "Tiered Dresses",
    season:    "SPRING 2026",
    imagePath: "/products/product2.png",
    bgPath:    "/products/bg2.jpg",
  },
];

type Props = {
  onTryLook: (productId: number) => void;
};

export default function ProductSwiper({ onTryLook }: Props) {
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => (i - 1 + PRODUCTS.length) % PRODUCTS.length);
  const next = () => setIndex((i) => (i + 1) % PRODUCTS.length);

  const product = PRODUCTS[index];

  return (
    <div className="relative flex h-dvh w-full flex-col items-center overflow-hidden bg-black">

      {/* Background image */}
      <Image
        key={product.bgPath}
        src={product.bgPath}
        alt=""
        fill
        priority
        className="object-cover object-center"
      />

      {/* Phone mockup — centred, upper half */}
      <div className="relative z-10 mx-auto mt-[10%] flex flex-col items-center">

        {/* Frosted glass phone frame */}
        <div className="relative h-[401px] w-[291px] overflow-hidden rounded-[24px] border-2 border-white/80 shadow-[0_0_60px_rgba(0,0,0,0.6)]">
          {/* Frosted glass inner gradient */}
          <div className="absolute inset-0 rounded-[24px] backdrop-blur-[21px]"
            style={{
              background: "radial-gradient(ellipse at 0% 0%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)",
            }}
          />
          {/* Product image */}
          <div className="relative h-full w-full">
            <Image
              key={product.imagePath}
              src={product.imagePath}
              alt={product.name}
              fill
              className="object-contain object-center"
              priority
            />
          </div>
          {/* Inner edge highlight */}
          <div className="pointer-events-none absolute inset-[-2px] rounded-[inherit] shadow-[inset_-5px_-5px_250px_0px_rgba(255,255,255,0.04)]" />
        </div>

        {/* Season + name */}
        <p
          className="mt-6 text-[13px] tracking-[0.08em] text-white/60"
          style={{ fontFamily: "var(--font-hanken), sans-serif" }}
        >
          {product.season}
        </p>
        <p
          className="mt-1 text-[30px] font-bold leading-tight tracking-[-0.35px] text-white"
          style={{ fontFamily: "var(--font-bricolage), sans-serif" }}
        >
          {product.name}
        </p>
      </div>

      {/* Prev / Next arrows */}
      <button
        onClick={prev}
        aria-label="Previous look"
        className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white backdrop-blur-sm"
      >
        ‹
      </button>
      <button
        onClick={next}
        aria-label="Next look"
        className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white backdrop-blur-sm"
      >
        ›
      </button>

      {/* Dot indicator */}
      <div className="absolute bottom-28 z-10 flex gap-2">
        {PRODUCTS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/40"}`}
          />
        ))}
      </div>

      {/* EXPLORE FASHION / Try the look button */}
      <div className="absolute bottom-8 z-10 w-[calc(100%-64px)]">
        <button
          onClick={() => onTryLook(product.id)}
          className="flex h-14 w-full items-center justify-center rounded-lg border border-white/60 bg-white/10 backdrop-blur-[39px]"
        >
          <span
            className="text-[22px] font-bold tracking-wide text-white"
            style={{ fontFamily: "var(--font-hanken), sans-serif" }}
          >
            EXPLORE FASHION
          </span>
        </button>
      </div>

    </div>
  );
}
