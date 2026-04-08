## Preferred camera flow
- **Back camera**: poster scan + trend discovery
- **Front camera**: try-on (mirror-like)
- Allow camera flip if needed
- v1 emphasis: **upper-body try-on** (more robust than full-body)

## Main user flow (MVP)
### 0) Landing
- User sees a simple start CTA (“Scan poster”)
- Optional microcopy: “Point at the spring trends poster”

### 1) Poster scanning (back camera)
- Live camera view
- Minimal scanning guide (frame corners or subtle reticle)
- Feedback states:
  - Searching
  - Marker found (lock)
  - Tracking stable

### 2) Trend discovery (anchored to poster)
- Trend cards appear above/around the poster
- Interactions:
  - Swipe left/right to browse
  - Tap a card to expand (name + short descriptor)
  - Primary CTA: “Try on”

### 3) Transition to try-on
- Prompt: “Switch to front camera to try this look”
- Short animated transition / fade to reduce jarring switch

### 4) Body framing guidance (front camera)
- Simple upper-body framing guide (silhouette outline or shoulder-line)
- “Move back”/“Center yourself” micro-feedback
- When tracking is ready: “Fitting…” → “Ready”

### 5) Real-time try-on
- Outfit overlay aligns to shoulders/torso landmarks
- Subtle adjustment feedback while stabilizing
- Controls:
  - Swap look (back to cards)
  - Compare (optional: quick A/B)
  - Save/share (screenshot)

## Edge cases
- Marker not found: show “Try better lighting / move closer”
- Marker lost while browsing: freeze cards + prompt to re-acquire
- Low tracking confidence in try-on: show “Hold still” and pause overlay updates

