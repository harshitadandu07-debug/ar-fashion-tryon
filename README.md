## Double Take — Web AR Fashion Try-On (MVP)

Build a **mobile-first WebAR experience** where a user scans a **poster** (or enters via **QR**), browses **Spring 2026** trend cards, taps a look, and enters a **live face try-on** to preview the look in real time — then **save/share**.

### Tech stack (locked for v1)
- **Framework**: Next.js (App Router)
- **UI**: React
- **Styling**: Tailwind CSS
- **Image tracking + face tracking**: MindAR
- **Rendering**: three.js
- **Data**: static JSON (`data/looks.json`)
- **Deploy**: Vercel

### Definition of done (MVP)
1. Open on mobile (URL or QR)
2. Grant camera permission
3. Scan poster (or skip via QR fallback)
4. Browse swipeable trend cards
5. Tap a look → live face try-on
6. Save or share a screenshot

### Docs
- **Full context/spec**: `docs/CONTEXT.md`
- **Implementation plan**: `docs/IMPLEMENTATION-PLAN.md`
- **Architecture + state model**: `docs/ARCHITECTURE.md`

### Push to GitHub (no GitHub CLI required)
1. In the browser, while signed in: [create a new empty repository](https://github.com/new) named `ar-fashion-tryon` (no README).
2. In Terminal, from this folder, run:

`./scripts/after-github-repo-created.sh YOUR_GITHUB_USERNAME`

If Git asks for a password, use a [Personal Access Token](https://github.com/settings/tokens) with `repo` scope, not your GitHub account password.

