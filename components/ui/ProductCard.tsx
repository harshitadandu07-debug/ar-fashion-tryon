import Image from "next/image";

export type Product = {
  id: number;
  category: string;
  name: string;
  description: string;
  price: string;
  image?: string;
  overlayAsset?: string;  // transparent PNG for AR try-on
};

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="w-52 flex-shrink-0 rounded-2xl bg-black/40 backdrop-blur-md border border-white/15 overflow-hidden">
      <div className="relative h-64 w-full bg-white">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain mix-blend-multiply"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-white/20 text-xs">
            no image
          </div>
        )}
      </div>
      <div className="px-4 py-3 text-white">
        <p className="text-[10px] font-semibold tracking-widest text-white/40 uppercase">Spring 2025</p>
        <h3 className="mt-1 text-base font-semibold leading-tight">{product.name}</h3>
      </div>
    </div>
  );
}
