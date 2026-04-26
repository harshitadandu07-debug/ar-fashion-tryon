import Image from "next/image";
import Link from "next/link";

export default function Page() {
  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-black">

      {/* Full-screen background model photo */}
      <Image
        src="/home/bg.jpg"
        alt=""
        fill
        priority
        className="object-cover object-center"
      />

      {/* Dark gradient overlay — left-heavy as in design */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/30 to-transparent" />

      {/* Content wrapper — centred, max mobile width */}
      <div className="relative mx-auto flex min-h-dvh max-w-[403px] flex-col">

        {/* Title + tagline */}
        <div className="pt-12 text-center">
          <h1
            className="text-[48px] font-bold leading-tight tracking-[-1px] text-white"
            style={{ fontFamily: "var(--font-bricolage), sans-serif" }}
          >
            StyleCast
          </h1>
          <p
            className="mt-1 text-[20px] leading-snug tracking-[-0.15px] text-white/90"
            style={{ fontFamily: "var(--font-hanken), sans-serif" }}
          >
            &ldquo;Try trends in real time&rdquo;
          </p>
        </div>

        {/* Floating polaroid images */}

        {/* Shoes — top-left, rotated -28° */}
        <div className="absolute left-[6%] top-[18%]">
          <div className="-rotate-[28deg]">
            <div className="rounded-[4px] bg-white shadow-2xl" style={{ padding: "6px 6px 22px 6px" }}>
              <div className="relative h-[156px] w-[120px] overflow-hidden">
                <Image src="/home/shoes.jpg" alt="Shoes" fill className="object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* Jacket — right side, rotated +12° */}
        <div className="absolute right-[4%] top-[35%]">
          <div className="rotate-12">
            <div className="rounded-[3px] bg-white shadow-2xl" style={{ padding: "5px 5px 20px 5px" }}>
              <div className="relative h-[149px] w-[114px] overflow-hidden">
                <Image src="/home/jacket.jpg" alt="Jacket" fill className="object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* Floral dress — lower-centre-left, rotated -16° */}
        <div className="absolute left-[12%] top-[48%]">
          <div className="-rotate-[16deg]">
            <div className="rounded-[4px] bg-white shadow-2xl" style={{ padding: "7px 7px 27px 7px" }}>
              <div className="relative h-[217px] w-[166px] overflow-hidden">
                <Image src="/home/dress.jpg" alt="Dress" fill className="object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* EXPLORE FASHION button — pinned to bottom */}
        <div className="mt-auto px-5 pb-10">
          <Link
            href="/looks"
            className="flex h-14 w-full items-center justify-center rounded-xl border border-white/70 bg-white/10 backdrop-blur-[39px]"
          >
            <span
              className="text-[22px] font-bold tracking-wide text-white"
              style={{ fontFamily: "var(--font-hanken), sans-serif" }}
            >
              EXPLORE FASHION
            </span>
          </Link>
        </div>

      </div>
    </main>
  );
}
