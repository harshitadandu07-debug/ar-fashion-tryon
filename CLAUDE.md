# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (Turbopack) at http://localhost:3000
npm run build    # production build
npm run lint     # ESLint
npx tsc --noEmit # type-check without emitting
```

## Stack

- **Next.js 16** — App Router, no `src/` directory, `@/*` maps to the project root
- **Tailwind CSS v4** — configured via `@tailwindcss/postcss` in `postcss.config.mjs`; no `tailwind.config` file; utilities written directly in JSX classNames
- **Three.js** — installed as npm package (`three` + `@types/three`)
- **MindAR** — loaded via CDN (`next/script` in `app/layout.tsx`) as `mindar-image-three.prod.js`; not an npm dependency (native build fails on this machine)

## Architecture

The app is a mobile-first WebAR fashion try-on experience ("Double Take").

**Routes**
- `/` (`app/page.tsx`) — landing page with "Start AR" and QR fallback CTAs
- `/ar` (`app/ar/page.tsx`) — thin shell that renders `<CameraView />`

**Key component: `CameraView`** (`components/ar/CameraView.tsx`)
This is a `"use client"` component that owns the entire AR session state machine:
1. `idle` / `requesting` → permission screen
2. `granted` → live `<video>` feed + flip-camera button + horizontal product card scroll
3. `denied` → error screen

Camera stream lifecycle is managed with `useRef<MediaStream>` and torn down in a `useEffect` cleanup. The `facingMode` state (`"environment"` | `"user"`) drives which camera is active.

**Product data** is a hardcoded `PRODUCTS` array at the top of `CameraView.tsx`. The `Product` type is exported from `components/ui/ProductCard.tsx` and co-located with the card component.

## MindAR usage note

MindAR is a browser-only library. Do not attempt `npm install mind-ar` — it pulls in `canvas` which requires native build tools not available on this machine. Always load it via the CDN script tag already in `app/layout.tsx`.
