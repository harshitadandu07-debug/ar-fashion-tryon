## Implementation plan (MVP-first)

### Phase 0 — Project setup
- Initialize Next.js app (App Router)
- Add Tailwind CSS
- Install `three` + MindAR packages
- Add routes:
  - `/` landing
  - `/ar` experience
- Deploy early (blank shell) to Vercel

### Phase 1 — App shell + permissions
- Landing page with “Start AR” CTA
- Camera permission module:
  - request
  - denied state messaging
  - no blank-screen failures

### Phase 2 — Poster detection (MindAR image)
- Add `public/targets/poster.mind`
- Start image tracking session
- Show visual confirmation on detection
- Unlock trend browsing UI

### Phase 3 — Trend browsing
- Create `data/looks.json` (6–8 looks)
- Implement swipeable carousel
- Select look → CTA “Try this look”

### Phase 4 — Face try-on (MindAR face)
- Switch to front camera
- Start face tracking session
- Attach overlay based on `overlayType` (glasses/headwear/jewelry/effect)
- Allow switching looks without leaving try-on

### Phase 5 — Save/share
- Capture screenshot from the rendered canvas
- Save image (download)
- Share using `navigator.share` when supported (mobile)

### Phase 6 — QR fallback
- Support query param e.g. `/ar?entry=qr`
- When entry=qr: skip poster detection, go straight to browsing

### Phase 7 — Polish + QA
- Test on iPhone Safari + Android Chrome
- Optimize assets + load speed
- Tune copy + transitions

