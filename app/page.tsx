export default function Page() {
  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-6 py-12">

        {/* Top brand */}
        <header>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
            Double Take
          </p>
        </header>

        {/* Hero */}
        <section className="space-y-5">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            <span className="text-xs font-medium text-white/70">
              AR Try-On Live
            </span>
          </div>

          <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight">
            Try on Spring&nbsp;2026
            <br />
            before you buy.
          </h1>

          <p className="text-sm leading-relaxed text-white/60">
            Point your front camera at your face and browse this season&apos;s
            looks — no app download, no sign-up. Just you and the look.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            {["Front camera", "Instant AR", "No download"].map((f) => (
              <span
                key={f}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50"
              >
                {f}
              </span>
            ))}
          </div>
        </section>

        {/* CTAs */}
        <section className="space-y-3">
          <a
            href="/looks"
            className="block w-full rounded-2xl bg-white px-5 py-4 text-center text-sm font-semibold text-black"
          >
            Explore Fashion Trends
          </a>
          <p className="text-center text-xs text-white/30">
            Best in good lighting · iPhone Safari &amp; Android Chrome
          </p>
        </section>

      </div>
    </main>
  );
}
