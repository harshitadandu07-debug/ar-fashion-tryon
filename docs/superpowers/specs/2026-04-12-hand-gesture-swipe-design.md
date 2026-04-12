# Hand Gesture + Touch Swipe for Product Cards — Design Spec

## Goal

Allow users to navigate product cards using either a hand wave in front of the camera (AR gesture) or a finger swipe on the screen (touch). Both inputs drive the same card scroll behavior.

---

## Architecture

Two independent input channels call a shared `scrollCards(direction)` function:

1. **Hand gesture channel** — `useHandGesture` hook, MediaPipe Hands via CDN, wrist tracking
2. **Touch channel** — `react-swipeable` on the cards container

```
useHandGesture(videoRef, onSwipe) ──┐
                                    ├──▶ scrollCards('left' | 'right')
react-swipeable onSwiped* ──────────┘
```

---

## Files

| Action | File | Purpose |
|--------|------|---------|
| Modify | `app/layout.tsx` | Add MediaPipe Hands CDN script tag |
| Create | `components/ar/useHandGesture.ts` | Hand gesture detection hook |
| Modify | `components/ar/CameraView.tsx` | Mount hook, add swipeable, scrollCards, gesture indicator |

---

## MediaPipe CDN Script

Add to `app/layout.tsx` alongside the existing MindAR script:

```tsx
<Script
  src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"
  strategy="beforeInteractive"
/>
<Script
  src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
  strategy="beforeInteractive"
/>
```

---

## useHandGesture Hook

**File:** `components/ar/useHandGesture.ts`

**Signature:**
```ts
export function useHandGesture(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  onSwipe: (direction: 'left' | 'right') => void
): void
```

**Logic:**
- Initializes MediaPipe `Hands` with `maxNumHands: 1`, `modelComplexity: 0` (fastest)
- Sets up a MediaPipe `Camera` loop on the video element
- On each frame: reads wrist landmark (index 0) normalized X position (0 = left edge, 1 = right edge)
- Stores last wrist X + timestamp
- If `Math.abs(currentX - prevX) > 0.15` AND elapsed time `< 400ms`:
  - `currentX < prevX` → swipe right (hand moved left → scroll right... wait, need to think about this)
  - Actually: hand moves RIGHT (X increases) → scroll cards RIGHT (next card)
  - hand moves LEFT (X decreases) → scroll cards LEFT (previous card)
  - Fire `onSwipe` with direction
  - Set cooldown timestamp
- Ignores new gestures within 800ms cooldown after last trigger
- Cleans up Camera on unmount

**Sensitivity parameters (constants at top of file):**
```ts
const DELTA_THRESHOLD = 0.15;  // 15% of frame width
const TIME_WINDOW_MS = 400;     // movement must happen within 400ms
const COOLDOWN_MS = 800;        // wait before next gesture
```

---

## CameraView Changes

### scrollCards function
```ts
function scrollCards(direction: 'left' | 'right') {
  cardsRef.current?.scrollBy({
    left: direction === 'right' ? 288 : -288,
    behavior: 'smooth',
  });
}
```
Card step = 256px (card width) + 32px (gap) = 288px.

### Cards container ref
Add `cardsRef = useRef<HTMLDivElement>(null)` and attach to the scrollable div.

### react-swipeable
Wrap cards container with swipe handlers:
- `onSwipedLeft` → `scrollCards('right')`
- `onSwipedRight` → `scrollCards('left')`
- `delta: 30`
- `preventScrollOnSwipe: true`

### useHandGesture mount
```ts
useHandGesture(videoRef, (dir) => {
  scrollCards(dir);
  showGestureIndicator(dir);
});
```

### Gesture indicator
- State: `gestureHint: 'left' | 'right' | null`
- When set: render a pill `← Swipe` or `Swipe →` centered above the cards
- Auto-clears after 600ms via `setTimeout`
- Styled: `bg-white/20 backdrop-blur text-white text-xs px-3 py-1 rounded-full`
- Only shown for hand gestures (not touch swipes)

---

## Gesture Direction Mapping

| Hand movement | X delta | scrollCards call | Cards move |
|---|---|---|---|
| Hand sweeps right | positive (increases) | `scrollCards('right')` | Next card |
| Hand sweeps left | negative (decreases) | `scrollCards('left')` | Previous card |
| Finger swipes left on screen | — | `scrollCards('right')` | Next card |
| Finger swipes right on screen | — | `scrollCards('left')` | Previous card |

---

## Out of Scope
- Multi-hand detection
- Pinch/zoom gestures
- Gesture to open a product detail
- Haptic feedback
