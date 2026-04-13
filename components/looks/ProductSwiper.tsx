"use client";

import { useState } from "react";
import Image from "next/image";

type Product = {
  id: number;
  name: string;
  season: string;
  imagePath: string;
};

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Mode Sportif",
    season: "SPRING 2026",
    imagePath: "/seasons/spring/linen-trench-coat.jpg",
  },
  {
    id: 2,
    name: "Polka Dots",
    season: "SPRING 2026",
    imagePath: "/seasons/spring/cotton-shirt.jpg",
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
    <div
      className="relative flex h-dvh w-full flex-col items-center overflow-hidden"
      style={{
        background:
          "linear-gradient(116deg, rgb(255,251,235) 0%, rgb(253,242,248) 50%, rgb(243,232,255) 100%)",
      }}
    >
      {/* Product image */}
      <div className="relative mt-24 h-[55%] w-[72%]">
        <Image
          key={product.id}
          src={product.imagePath}
          alt={product.name}
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Left arrow */}
      <button
        onClick={prev}
        aria-label="Previous look"
        className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-2xl text-black/50 hover:text-black"
      >
        ‹
      </button>

      {/* Right arrow */}
      <button
        onClick={next}
        aria-label="Next look"
        className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-2xl text-black/50 hover:text-black"
      >
        ›
      </button>

      {/* Product info */}
      <div className="mt-auto pb-32 text-center">
        <p className="text-xs tracking-widest text-[#6e6e6e]">{product.season}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-[#0a0a0a]">
          {product.name}
        </p>
      </div>

      {/* Try the look button */}
      <div className="absolute bottom-8 w-[calc(100%-64px)]">
        <button
          onClick={() => onTryLook(product.id)}
          className="w-full rounded-full bg-black py-4 text-base font-medium text-white shadow-lg"
        >
          Try the look
        </button>
      </div>
    </div>
  );
}
