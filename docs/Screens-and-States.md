## Screen/state inventory (MVP)

### 1) Landing / start
- **Goal**: user understands the poster-driven experience in 2 seconds
- **UI**: Start CTA (“Scan poster”), optional “How it works” icon

### 2) Marker scanning (back camera)
- **Goal**: guide user to find poster
- **States**:
  - Searching (soft pulsing reticle)
  - Candidate detected (pre-lock)
  - Locked + tracking stable
- **Acceptance**: scanning feedback updates within ~200–500ms of state changes

### 3) Marker recognized
- **Goal**: confirm success without text-heavy UI
- **UI**: subtle lock animation + haptic (optional)

### 4) Trend cards browsing
- **Goal**: swipeable seasonal looks anchored to poster
- **UI**:
  - Card stack/carousel
  - Each card: look name, 1-line descriptor, thumbnail
  - Primary CTA: “Try on”
- **Acceptance**: swipe feels responsive; selection is obvious

### 5) Look selected
- **Goal**: confirm chosen look
- **UI**: selected state highlight + “Try on” CTA

### 6) Transition to try-on
- **Goal**: smooth camera switch + expectation setting
- **UI**: short modal/overlay, 1 line text max

### 7) Body framing guidance
- **Goal**: get user into trackable pose quickly
- **UI**: silhouette/shoulder guide, micro-feedback (“step back”, “center”)
- **Acceptance**: “ready” state appears quickly once tracking stabilizes

### 8) Real-time try-on
- **Goal**: believable overlay + stable alignment
- **UI**:
  - Look name
  - Save/share
  - Switch look
- **Acceptance**: overlay does not jitter excessively; has smoothing

### 9) Save/share/explore more
- **Goal**: capture value and re-engage
- **UI**: preview image + “Share” + “Try another look”

