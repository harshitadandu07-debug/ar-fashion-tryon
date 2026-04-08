export default function ProductCard() {
  return (
    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/15">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 flex-shrink-0 rounded-xl bg-white/20 overflow-hidden">
          {/* placeholder for product image */}
          <div className="h-full w-full flex items-center justify-center text-white/40 text-xs">
            img
          </div>
        </div>
        <div className="flex-1 min-w-0 text-white">
          <p className="text-xs font-semibold tracking-wide text-white/50 uppercase">
            Spring 2026
          </p>
          <h3 className="mt-0.5 text-base font-semibold leading-tight truncate">
            Linen Trench Coat
          </h3>
          <p className="mt-0.5 text-sm text-white/60">Beige — Oversized fit</p>
          <p className="mt-1 text-base font-semibold">$320</p>
        </div>
      </div>
      <button className="mt-3 w-full rounded-xl bg-white py-3 text-sm font-semibold text-black">
        Try this look
      </button>
    </div>
  );
}
