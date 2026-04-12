import Image from "next/image";

export type Product = {
  id: number;
  category: string;
  name: string;
  description: string;
  price: string;
  image?: string;
};

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="w-64 flex-shrink-0 rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/15">
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 flex-shrink-0 rounded-xl bg-white/20 overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-white/40 text-xs">
              img
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 text-white">
          <p className="text-xs font-semibold tracking-wide text-white/50 uppercase">
            {product.category}
          </p>
          <h3 className="mt-0.5 text-base font-semibold leading-tight truncate">
            {product.name}
          </h3>
          <p className="mt-0.5 text-sm text-white/60">{product.description}</p>
          <p className="mt-1 text-base font-semibold text-white">{product.price}</p>
        </div>
      </div>
    </div>
  );
}
