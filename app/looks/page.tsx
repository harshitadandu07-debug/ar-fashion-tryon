"use client";

import ProductSwiper from "@/components/looks/ProductSwiper";

export default function LooksPage() {
  function handleTryLook(productId: number) {
    // Camera overlay wired in next step
    console.log("Try look:", productId);
  }

  return <ProductSwiper onTryLook={handleTryLook} />;
}
