# Touch Gesture Overlay Fine-Tuning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users drag the AR outfit overlay to align it with their shoulder line after it auto-appears, with a one-time guide prompt and a persistent "Adjust fit" re-entry button.

**Architecture:** State (`adjustOffset`, `isAdjustMode`, `showFirstGuide`) lives in `CameraView` following the existing pattern. `TryOnRenderer` receives props, owns touch capture via a transparent overlay div, and fires callbacks up. `drawGarmentAffine` applies the offset via a new optional param.

**Tech Stack:** React 19, Next.js 16 App Router, TypeScript, Tailwind CSS v4, canvas 2D API

---

## File Map

| File | Change |
|---|---|
| `components/ar/canvasWarp.ts` | Add optional `adjustOffset` param to `drawGarmentAffine` |
| `components/ar/TryOnRenderer.tsx` | New props, touch-capture div, first-guide overlay, `onFirstOverlay` trigger |
| `components/ar/CameraView.tsx` | New state + callbacks, "Adjust fit" button, timer, reset on outfit/camera change |

---

## Task 1: Extend `drawGarmentAffine` with `adjustOffset`

**Files:**
- Modify: `components/ar/canvasWarp.ts`

- [ ] **Step 1: Add `adjustOffset` param and apply it in the translate call**

Open `components/ar/canvasWarp.ts`. Replace the function signature and the `ctx.translate` line:

```ts
// Before
export function drawGarmentAffine(
  ctx:         CanvasRenderingContext2D,
  img:         CanvasImageSource,
  torso:       TorsoPoints,
  calibration: GarmentCalibration,
  canvasW:     number,
  canvasH:     number,
  alpha = 1,
): void {

// After
export function drawGarmentAffine(
  ctx:          CanvasRenderingContext2D,
  img:          CanvasImageSource,
  torso:        TorsoPoints,
  calibration:  GarmentCalibration,
  canvasW:      number,
  canvasH:      number,
  alpha = 1,
  adjustOffset: { x: number; y: number } = { x: 0, y: 0 },
): void {
```

Then find the translate line (around line 64) and replace it:

```ts
// Before
  ctx.translate(midX, midY);

// After
  ctx.translate(midX + adjustOffset.x, midY + adjustOffset.y);
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/harshitadandu/Documents/Playground/project-1 && npx tsc --noEmit
```

Expected: no errors (the new param is optional with a default, so all existing call sites remain valid).

- [ ] **Step 3: Commit**

```bash
git add components/ar/canvasWarp.ts
git commit -m "feat: add adjustOffset param to drawGarmentAffine"
```

---

## Task 2: Update TryOnRenderer — props, touch handling, first-guide UI

**Files:**
- Modify: `components/ar/TryOnRenderer.tsx`

- [ ] **Step 1: Replace the Props type**

Find the `type Props` block (lines 12–18) and replace it:

```ts
type Props = {
  videoRef:       React.RefObject<HTMLVideoElement | null>;
  products:       Product[];
  activeIndex:    number;
  onSwipe:        (dir: "left" | "right") => void;
  onStatus:       (status: string) => void;
  adjustOffset:   { x: number; y: number };
  isAdjustMode:   boolean;
  showFirstGuide: boolean;
  onDrag:         (dx: number, dy: number) => void;
  onFirstOverlay: () => void;
};
```

- [ ] **Step 2: Destructure the new props**

Find the function signature line:
```ts
export default function TryOnRenderer({ videoRef, products, activeIndex, onSwipe, onStatus }: Props) {
```
Replace with:
```ts
export default function TryOnRenderer({
  videoRef, products, activeIndex, onSwipe, onStatus,
  adjustOffset, isAdjustMode, showFirstGuide, onDrag, onFirstOverlay,
}: Props) {
```

- [ ] **Step 3: Add new refs after existing stable callback refs**

After the block ending with `const stableStatus = ...` (around line 29), add:

```ts
  const adjustOffsetRef          = useRef(adjustOffset);
  const onDragRef                = useRef(onDrag);
  const onFirstOverlayRef        = useRef(onFirstOverlay);
  const hasTriggeredFirstOverlay = useRef(false);
  const lastTouchRef             = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { adjustOffsetRef.current       = adjustOffset;   }, [adjustOffset]);
  useEffect(() => { onDragRef.current             = onDrag;         }, [onDrag]);
  useEffect(() => { onFirstOverlayRef.current     = onFirstOverlay; }, [onFirstOverlay]);
  // Reset first-overlay trigger when the active outfit changes
  useEffect(() => { hasTriggeredFirstOverlay.current = false; },       [activeIndex]);
```

- [ ] **Step 4: Add the `onFirstOverlay` trigger effect**

After the `useEffect` that syncs `confidenceRef` (around line 37), add:

```ts
  // Fire onFirstOverlay once per outfit when confidence crosses threshold and garment is loaded
  useEffect(() => {
    if (
      confidence >= CONFIDENCE_THRESHOLD &&
      garmentRef.current !== null &&
      !hasTriggeredFirstOverlay.current
    ) {
      hasTriggeredFirstOverlay.current = true;
      onFirstOverlayRef.current();
    }
  }, [confidence]);
```

- [ ] **Step 5: Add the garment-load trigger path**

The confidence effect only fires when confidence changes. If confidence is already high when the garment finishes loading, the effect won't re-run. Add a second trigger inside the garment loading `useEffect`.

Find the `.then((offscreen) => {` block (around line 69) and update it:

```ts
    removeWhiteBackground(src).then((offscreen) => {
      if (activeIndexRef.current === activeIndex) {
        garmentRef.current = offscreen;
        // Trigger guide if confidence was already above threshold when garment loaded
        if (
          offscreen !== null &&
          confidenceRef.current >= CONFIDENCE_THRESHOLD &&
          !hasTriggeredFirstOverlay.current
        ) {
          hasTriggeredFirstOverlay.current = true;
          onFirstOverlayRef.current();
        }
      }
    });
```

- [ ] **Step 6: Pass `adjustOffset` into the RAF render loop**

Inside the `render` function (inside the RAF `useEffect`), find the `drawGarmentAffine` call and add the offset arg:

```ts
          drawGarmentAffine(ctx, garment, currentTorso, config.calibration, W, H, garmentAlpha, adjustOffsetRef.current);
```

- [ ] **Step 7: Add touch handler functions**

Add these three functions inside the component body, before the `return`:

```ts
  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchMove(e: React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas || !lastTouchRef.current) return;
    const touch = e.touches[0];
    const rect  = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const dx = (touch.clientX - lastTouchRef.current.x) * scale;
    const dy = (touch.clientY - lastTouchRef.current.y) * scale;
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    onDragRef.current(dx, dy);
  }

  function handleTouchEnd() {
    lastTouchRef.current = null;
  }
```

- [ ] **Step 8: Add touch-capture div and first-guide overlay to JSX**

In the `return` block, after the `<canvas>` element and before the guidance overlay `{showGuidance && ...}`, add:

```tsx
      {/* Touch-capture layer — active during adjust mode or first guide */}
      {(isAdjustMode || showFirstGuide) && (
        <div
          className="absolute inset-0 z-10"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {showFirstGuide && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-4">
                  <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <polyline points="15,18 9,12 15,6" />
                  </svg>
                  <div className="flex flex-col items-center gap-2">
                    <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <polyline points="18,15 12,9 6,15" />
                    </svg>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#6366f1">
                        <path d="M9 11.24V7.5a2.5 2.5 0 015 0v3.74c1.21-.81 2-2.18 2-3.74a4 4 0 00-8 0c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6.5a1.5 1.5 0 00-3 0V14l-3.12-.65a.5.5 0 00-.48.13l-.7.71 4.5 4.68A4.98 4.98 0 0014 21h3.73a1 1 0 00.98-.8l.67-3.48a1 1 0 00-.54-1.05z"/>
                      </svg>
                    </div>
                    <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <polyline points="6,9 12,15 18,9" />
                    </svg>
                  </div>
                  <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                </div>
                <div className="rounded-full bg-black/60 px-4 py-1.5 backdrop-blur-sm">
                  <span className="text-xs font-semibold text-white">Drag to adjust fit</span>
                </div>
                <span className="text-[10px] text-white/45">Dismisses automatically</span>
              </div>
            </div>
          )}

          {isAdjustMode && !showFirstGuide && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 backdrop-blur-sm pointer-events-none">
              <span className="text-xs text-white/80">Drag to reposition</span>
            </div>
          )}
        </div>
      )}
```

- [ ] **Step 9: Type-check**

```bash
cd /Users/harshitadandu/Documents/Playground/project-1 && npx tsc --noEmit
```

Expected: errors on `TryOnRenderer` usage in `CameraView.tsx` (missing new props) — those are expected and will be fixed in Task 3.

- [ ] **Step 10: Commit**

```bash
git add components/ar/TryOnRenderer.tsx
git commit -m "feat: add touch-capture, first-guide overlay, and adjustOffset support to TryOnRenderer"
```

---

## Task 3: Update CameraView — state, callbacks, button, resets

**Files:**
- Modify: `components/ar/CameraView.tsx`

- [ ] **Step 1: Add new state and timer ref**

In `CameraView`, after the existing state declarations (after `const [activeIndex, setActiveIndex] = useState(0);`, around line 44), add:

```ts
  const [adjustOffset,           setAdjustOffset]           = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isAdjustMode,           setIsAdjustMode]           = useState(false);
  const [showFirstGuide,         setShowFirstGuide]         = useState(false);
  const [firstGuideHasBeenShown, setFirstGuideHasBeenShown] = useState(false);
  const adjustTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

- [ ] **Step 2: Add `startAdjustTimer` helper**

After the `scrollCards` callback, add:

```ts
  const startAdjustTimer = useCallback(() => {
    if (adjustTimerRef.current) clearTimeout(adjustTimerRef.current);
    adjustTimerRef.current = setTimeout(() => {
      setIsAdjustMode(false);
      setShowFirstGuide(false);
    }, 3000);
  }, []);
```

- [ ] **Step 3: Add `handleFirstOverlay` and `handleDrag` callbacks**

After `startAdjustTimer`, add:

```ts
  const handleFirstOverlay = useCallback(() => {
    setShowFirstGuide(true);
    setIsAdjustMode(true);
    setFirstGuideHasBeenShown(true);
    startAdjustTimer();
  }, [startAdjustTimer]);

  const handleDrag = useCallback((dx: number, dy: number) => {
    setAdjustOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    startAdjustTimer();
  }, [startAdjustTimer]);
```

- [ ] **Step 4: Add reset effect on `activeIndex` change**

After the existing scroll-tracking `useEffect` (the one with `container.addEventListener("scroll", onScroll)`), add:

```ts
  // Reset adjust state whenever the user switches outfits
  useEffect(() => {
    if (adjustTimerRef.current) clearTimeout(adjustTimerRef.current);
    setAdjustOffset({ x: 0, y: 0 });
    setIsAdjustMode(false);
    setShowFirstGuide(false);
    setFirstGuideHasBeenShown(false);
  }, [activeIndex]);
```

- [ ] **Step 5: Add `adjustTimerRef` cleanup to the existing cleanup effect**

Find the cleanup `useEffect` (the one that stops `streamRef` tracks):

```ts
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (gestureTimerRef.current) clearTimeout(gestureTimerRef.current);
    };
  }, []);
```

Add the adjust timer cleanup:

```ts
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (gestureTimerRef.current) clearTimeout(gestureTimerRef.current);
      if (adjustTimerRef.current)  clearTimeout(adjustTimerRef.current);
    };
  }, []);
```

- [ ] **Step 6: Reset adjust state on camera flip**

Find the `toggleCamera` function and update it:

```ts
  async function toggleCamera() {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    if (adjustTimerRef.current) clearTimeout(adjustTimerRef.current);
    setAdjustOffset({ x: 0, y: 0 });
    setIsAdjustMode(false);
    setShowFirstGuide(false);
    await startCamera(next);
  }
```

- [ ] **Step 7: Pass new props to TryOnRenderer**

Find the `<TryOnRenderer ... />` usage in the AR session JSX and replace it:

```tsx
      <TryOnRenderer
        videoRef={videoRef}
        products={products}
        activeIndex={activeIndex}
        onSwipe={handleHandSwipe}
        onStatus={setMpStatus}
        adjustOffset={adjustOffset}
        isAdjustMode={isAdjustMode}
        showFirstGuide={showFirstGuide}
        onDrag={handleDrag}
        onFirstOverlay={handleFirstOverlay}
      />
```

- [ ] **Step 8: Add "Adjust fit" button to the AR session JSX**

In the AR session `return`, after the flip camera button (`</button>` for the flip camera, around line 194), add:

```tsx
      {/* Adjust fit button — appears after first guide has been dismissed */}
      {firstGuideHasBeenShown && !showFirstGuide && !isAdjustMode && (
        <button
          onClick={() => {
            setIsAdjustMode(true);
            startAdjustTimer();
          }}
          className="absolute left-4 top-14 z-20 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm"
          aria-label="Adjust outfit fit"
        >
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
          </svg>
          <span className="text-xs font-semibold text-white">Adjust fit</span>
        </button>
      )}
```

- [ ] **Step 9: Type-check — expect clean**

```bash
cd /Users/harshitadandu/Documents/Playground/project-1 && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add components/ar/CameraView.tsx
git commit -m "feat: add touch gesture overlay fine-tuning to CameraView"
```

---

## Task 4: Smoke test in browser

**Files:** none — verification only

- [ ] **Step 1: Start dev server**

```bash
cd /Users/harshitadandu/Documents/Playground/project-1 && npm run dev
```

Open `http://localhost:3000/ar` on a mobile device or Chrome DevTools with device emulation (iPhone 14 Pro, touch enabled).

- [ ] **Step 2: Verify first-guide flow**

1. Grant camera access.
2. Stand so the pose is detected (status pill shows "Pose detected").
3. Select an outfit that is `upper-body` category (product ID 1 or 2 in spring data).
4. Confirm the drag guide appears (finger icon + four arrows + "Drag to adjust fit" pill).
5. Wait 3 seconds without touching — confirm guide and adjust mode auto-dismiss.
6. Confirm "Adjust fit" pill button appears at top-left below the status pill.

- [ ] **Step 3: Verify drag repositions the overlay**

1. Tap "Adjust fit".
2. Confirm "Drag to reposition" hint appears.
3. Drag finger up/down/left/right — confirm garment overlay moves accordingly.
4. Release and wait 3s — confirm hint disappears and drag mode exits.

- [ ] **Step 4: Verify outfit-switch reset**

1. While the "Adjust fit" button is visible, swipe to a different product card.
2. Confirm the button disappears and `adjustOffset` resets (outfit snaps back to auto-detected position for the new product).

- [ ] **Step 5: Verify camera-flip reset**

1. Drag the overlay off-centre.
2. Tap the flip camera button.
3. Confirm offset resets (overlay returns to auto-detected position on the new camera).

- [ ] **Step 6: Final commit if any fixes were made during smoke test**

```bash
git add -p
git commit -m "fix: smoke test corrections for touch gesture overlay"
```
