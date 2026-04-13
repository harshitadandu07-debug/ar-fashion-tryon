"use client";

import { useState } from "react";
import ProductSwiper from "@/components/looks/ProductSwiper";
import CameraOverlay from "@/components/ar/CameraOverlay";
import type { Product } from "@/components/ui/ProductCard";

const PRODUCTS: Product[] = [
  {
    id: 1,
    category: "upper-body",
    name: "Mode Sportif",
    description: "Athletic meets elegant",
    price: "",
    image: "/seasons/spring/linen-trench-coat.jpg",
    overlayAsset: "/seasons/spring/linen-trench-coat.jpg",
  },
  {
    id: 2,
    category: "upper-body",
    name: "Polka Dots",
    description: "Effortless feminine style",
    price: "",
    image: "/seasons/spring/cotton-shirt.jpg",
    overlayAsset: "/seasons/spring/cotton-shirt.jpg",
  },
];

export default function LooksPage() {
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  return (
    <>
      <ProductSwiper
        onTryLook={(id) => {
          const p = PRODUCTS.find((p) => p.id === id) ?? null;
          setActiveProduct(p);
        }}
      />

      {activeProduct && (
        <CameraOverlay
          product={activeProduct}
          onClose={() => setActiveProduct(null)}
        />
      )}
    </>
  );
}
