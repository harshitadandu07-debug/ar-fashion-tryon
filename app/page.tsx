export default function Page() {
  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-5 py-10">
        <header className="space-y-2">
          <div className="text-xs font-semibold tracking-wide text-white/60">
            DOUBLE TAKE
          </div>
          <h1 className="text-3xl font-semibold leading-tight">
            WebAR Spring 2026
            <br />
            fashion try-on
          </h1>
          <p className="text-sm leading-relaxed text-white/70">
            Scan the poster or enter via QR, browse trend cards, then try a look
            live on your face.
          </p>
        </header>

        <section className="space-y-3">
          <a
            href="/ar"
            className="block w-full rounded-2xl bg-white px-5 py-4 text-center text-sm font-semibold text-black"
          >
            Start AR
          </a>
          <a
            href="/ar?entry=qr"
            className="block w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-center text-sm font-semibold text-white"
          >
            Enter via QR fallback
          </a>
          <p className="text-xs text-white/50">
            Tip: best results in good lighting. iPhone Safari + Android Chrome
            supported.
          </p>
        </section>
      </div>
    </main>
  );
}

