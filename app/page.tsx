import Image from "next/image";
import Link from "next/link";

export default function Page() {
  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-black">

      {/* Background */}
      <Image src="/home/bg.jpg" alt="" fill priority className="object-cover object-center anim-fade-in" />
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/30 to-transparent" />

      <div className="relative mx-auto flex min-h-dvh max-w-[403px] flex-col">

        {/* ── Title block — sits above cards ── */}
        <div className="relative z-20 pt-11 text-center">
          <h1
            className="anim-fade-down delay-100 text-[46px] font-bold leading-tight tracking-[-1px] text-white"
            style={{ fontFamily: "var(--font-bricolage), sans-serif" }}
          >
            StyleCast
          </h1>
          <p
            className="anim-fade-in delay-300 mt-1 text-[18px] leading-snug tracking-[-0.15px] text-white/85"
            style={{ fontFamily: "var(--font-hanken), sans-serif" }}
          >
            &ldquo;Try trends in real time&rdquo;
          </p>
        </div>

        {/* ── Polaroid cards — start 155 px below top so they clear the text ── */}

        {/* Shoes — top-left, -28° */}
        <div className="anim-slide-left delay-300 absolute left-[4%]" style={{ top: 155 }}>
          <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 -rotate-[55deg]">
            <Image src="/home/tape.png" alt="" width={64} height={24} className="opacity-75" />
          </div>
          <div className="-rotate-[28deg]">
            <div className="rounded-[4px] bg-white/15 backdrop-blur-md shadow-2xl" style={{ padding: "5px 5px 20px 5px" }}>
              <div className="relative h-[130px] w-[100px] overflow-hidden">
                <Image src="/home/shoes.jpg" alt="Shoes" fill className="object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* Jacket — right, +12° */}
        <div className="anim-slide-right delay-450 absolute right-[3%]" style={{ top: 285 }}>
          <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rotate-[15deg]">
            <Image src="/home/tape.png" alt="" width={40} height={24} className="opacity-75" />
          </div>
          <div className="rotate-12">
            <div className="rounded-[3px] bg-white/15 backdrop-blur-md shadow-2xl" style={{ padding: "5px 5px 20px 5px" }}>
              <div className="relative h-[120px] w-[92px] overflow-hidden">
                <Image src="/home/jacket.jpg" alt="Jacket" fill className="object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* Dress — lower-centre-left, -16° */}
        <div className="anim-slide-left delay-550 absolute left-[10%]" style={{ top: 400 }}>
          <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 rotate-[22deg]">
            <Image src="/home/tape.png" alt="" width={64} height={22} className="opacity-75" />
          </div>
          <div className="-rotate-[16deg]">
            <div className="rounded-[4px] bg-white/15 backdrop-blur-md shadow-2xl" style={{ padding: "6px 6px 24px 6px" }}>
              <div className="relative h-[175px] w-[134px] overflow-hidden">
                <Image src="/home/dress.jpg" alt="Dress" fill className="object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Button — pinned to bottom ── */}
        <div className="anim-fade-up delay-700 relative z-20 mt-auto px-5 pb-10">
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
