# Touch Gesture Overlay Fine-Tuning — 3D Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the drag-to-adjust-fit feature to the production 3D path (`CameraOverlay` → `ThreeARRenderer` → `useGarmentScene`).

**Architecture:** Same state/callback/timer pattern as the 2D port (already on this branch). Key difference: `adjustOffset` is applied to `garmentGrp.position` in Three.js world space (1 unit = 1 canvas pixel; y-axis inverted vs screen). Touch handling and first-guide UI are identical to `TryOnRenderer`.

**Tech Stack:** React 19, Next.js 16, TypeScript, Three.js, Tailwind CSS v4

---

## Coordinate system note

The orthographic camera is set up as `(-W/2, W/2, H/2, -H/2)` — 1 world unit = 1 canvas pixel. Screen x and world x increase in the same direction (right). Screen y increases downward; world y increases upward. So:

```ts
garmentGrp.position.x += adjustOffset.x;   // drag right → move right
garmentGrp.position.y -= adjustOffset.y;   // drag down (positive dy) → move down (negative world y)
```

The `adjustOffset` values arrive from `handleTouchMove` already scaled to canvas pixels (same formula as the 2D path).

---

## File Map

| File | Change |
|---|---|
| `components/ar/useGarmentScene.ts` | Add `adjustOffset` param to `UpdateSceneFn` + apply to `garmentGrp.position` |
| `components/ar/ThreeARRenderer.tsx` | New props, touch-capture div, first-guide overlay UI, `onFirstOverlay` trigger |
| `components/ar/CameraOverlay.tsx` | New state + callbacks, "Adjust fit" button, timer, reset on close |

---

## Task 5: Add `adjustOffset` to `updateScene` in `useGarmentScene.ts`

**Files:**
- Modify: `components/ar/useGarmentScene.ts`

- [ ] **Step 1: Add `adjustOffset` to `UpdateSceneFn` type**

Find the `UpdateSceneFn` type (around line 24) and add the new optional param:

```ts
export type UpdateSceneFn = (
  torso:        TorsoPoints | null,
  config:       GarmentConfig | null,
  W:            number,
  H:            number,
  conf:         number,
  adjustOffset?: { x: number; y: number },
) => void;
```

- [ ] **Step 2: Apply `adjustOffset` inside `updateScene`**

Inside the `updateScene` function, find the block that sets `garmentGrp.position` and rotation (around line 140):

```ts
    garmentGrp.position.copy(t.position);
    garmentGrp.position.y += config.yOffset3d * scale;
    garmentGrp.rotation.z  = t.rotationZ;
    garmentGrp.scale.setScalar(scale);
```

Replace with:

```ts
    garmentGrp.position.copy(t.position);
    garmentGrp.position.y += config.yOffset3d * scale;
    // Apply user drag offset (canvas pixels = world units in this ortho camera)
    if (adjustOffset) {
      garmentGrp.position.x += adjustOffset.x;
      garmentGrp.position.y -= adjustOffset.y;  // screen y-down → world y-up inverted
    }
    garmentGrp.rotation.z  = t.rotationZ;
    garmentGrp.scale.setScalar(scale);
```

- [ ] **Step 3: Type-check**

```bash
cd /Users/harshitadandu/Documents/Playground/project-1/.worktrees/feat/touch-gesture-overlay && npx tsc --noEmit
```

Expected: no errors (new param is optional so existing `updateScene(...)` call in `ThreeARRenderer` is still valid).

- [ ] **Step 4: Commit**

```bash
git add components/ar/useGarmentScene.ts
git commit -m "feat: add adjustOffset to updateScene for 3D garment drag"
```

---

## Task 6: Update `ThreeARRenderer` — props, touch handling, first-guide UI

**Files:**
- Modify: `components/ar/ThreeARRenderer.tsx`

- [ ] **Step 1: Expand Props type**

Find the `type Props` block and replace it:

```ts
type Props = {
  videoRef:       React.RefObject<HTMLVideoElement | null>;
  product:        Product;
  onStatus:       (status: string) => void;
  adjustOffset:   { x: number; y: number };
  isAdjustMode:   boolean;
  showFirstGuide: boolean;
  onDrag:         (dx: number, dy: number) => void;
  onFirstOverlay: () => void;
};
```

- [ ] **Step 2: Destructure new props**

Find:
```ts
export default function ThreeARRenderer({ videoRef, product, onStatus }: Props) {
```
Replace with:
```ts
export default function ThreeARRenderer({
  videoRef, product, onStatus,
  adjustOffset, isAdjustMode, showFirstGuide, onDrag, onFirstOverlay,
}: Props) {
```

- [ ] **Step 3: Add refs after existing stable callback refs**

After the block with `const stableStatus` and `const noopSwipe` (around line 24), add:

```ts
  const adjustOffsetRef          = useRef(adjustOffset);
  const onDragRef                = useRef(onDrag);
  const onFirstOverlayRef        = useRef(onFirstOverlay);
  const hasTriggeredFirstOverlay = useRef(false);
  const lastTouchRef             = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { adjustOffsetRef.current       = adjustOffset;   }, [adjustOffset]);
  useEffect(() => { onDragRef.current             = onDrag;         }, [onDrag]);
  useEffect(() => { onFirstOverlayRef.current     = onFirstOverlay; }, [onFirstOverlay]);
  // Reset first-overlay trigger when product changes
  useEffect(() => { hasTriggeredFirstOverlay.current = false; }, [product]);
```

- [ ] **Step 4: Add `onFirstOverlay` trigger effect**

After the `useEffect` that syncs `confidenceRef`, add:

```ts
  // Fire onFirstOverlay once per product when confidence crosses threshold and garment is loaded
  // garmentGrp.children.length is checked via refsRef — it's a ref, intentionally not in deps.
  // The garment-load callback path below handles the race where garment loads after confidence rises.
  useEffect(() => {
    const refs = refsRef.current;
    if (
      confidence >= CONFIDENCE_THRESHOLD &&
      refs !== null &&
      refs.garmentGrp.children.length > 0 &&
      !hasTriggeredFirstOverlay.current
    ) {
      hasTriggeredFirstOverlay.current = true;
      onFirstOverlayRef.current();
    }
  }, [confidence]);
```

**Important:** `refsRef` is currently a `SceneRefs` type that doesn't expose `garmentGrp` directly for reading. Looking at `useGarmentScene.ts`, `refsRef.current.garmentGrp` is the Three.js Group. But `ThreeARRenderer` doesn't have access to `refsRef` — it uses the `updateScene` function returned by `useGarmentScene`.

To enable the first-overlay trigger, `useGarmentScene` needs to expose a way to check if a garment is loaded. Add a `hasGarment` ref to `useGarmentScene`:

In `useGarmentScene.ts`, add to the return value:
```ts
export function useGarmentScene(): {
  threeCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  updateScene:    UpdateSceneFn;
  hasGarmentRef:  React.RefObject<boolean>;
}
```

Add in the hook body:
```ts
  const hasGarmentRef = useRef(false);
```

Update the garment-load section inside `updateScene` to set this ref when a garment is added (after `garmentGrp.add(clone)` in both the cached and non-cached paths):
```ts
  hasGarmentRef.current = garmentGrp.children.length > 0;
```

Also set it when the garment group is cleared:
```ts
  while (garmentGrp.children.length) garmentGrp.remove(garmentGrp.children[0]);
  hasGarmentRef.current = false;
```

Return it:
```ts
  return { threeCanvasRef, updateScene, hasGarmentRef };
```

Back in `ThreeARRenderer`, destructure it:
```ts
  const { threeCanvasRef, updateScene, hasGarmentRef } = useGarmentScene();
```

And use it in the trigger effect:
```ts
  useEffect(() => {
    if (
      confidence >= CONFIDENCE_THRESHOLD &&
      hasGarmentRef.current &&
      !hasTriggeredFirstOverlay.current
    ) {
      hasTriggeredFirstOverlay.current = true;
      onFirstOverlayRef.current();
    }
  }, [confidence]);
```

Note: `hasGarmentRef` is intentionally omitted from deps (ref mutation doesn't trigger effects; the garment-load trigger in the RAF loop handles the race condition — see Step 5).

- [ ] **Step 5: Add garment-load trigger path in the RAF loop**

In the RAF `render` function, after `updateScene(...)` is called, the scene has been updated. The garment load is async (GLTFLoader), so we need to check after each frame whether a garment just became available:

Find the `render` function and after the `updateScene(...)` call, add:

```ts
        // Trigger first-overlay guide if garment just loaded while confidence was already high
        if (
          hasGarmentRef.current &&
          confidenceRef.current >= CONFIDENCE_THRESHOLD &&
          !hasTriggeredFirstOverlay.current
        ) {
          hasTriggeredFirstOverlay.current = true;
          onFirstOverlayRef.current();
        }
```

- [ ] **Step 6: Pass `adjustOffsetRef.current` to `updateScene`**

Find the `updateScene(...)` call in the RAF loop and add the offset:

```ts
        updateScene(torsoRef.current, config, W, H, confidenceRef.current, adjustOffsetRef.current);
```

- [ ] **Step 7: Add touch handler functions**

Before the `return`, add:

```ts
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !lastTouchRef.current) return;
    const touch  = e.touches[0];
    const rect   = canvas.getBoundingClientRect();
    // Convert CSS-pixel deltas to canvas-pixel deltas (canvas intrinsic size ≠ displayed size)
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const dx = (touch.clientX - lastTouchRef.current.x) * scaleX;
    const dy = (touch.clientY - lastTouchRef.current.y) * scaleY;
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    onDragRef.current(dx, dy);
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastTouchRef.current = null;
  }, []);
```

- [ ] **Step 8: Add touch-capture div and first-guide overlay to JSX**

In the `return`, after the `<canvas>` element and before `{showGuidance && ...}`, add:

```tsx
      {/* Touch-capture layer — active during adjust mode or first guide */}
      {(isAdjustMode || showFirstGuide) && (
        <div
          className="absolute inset-0 z-20"
          aria-hidden="true"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
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
cd /Users/harshitadandu/Documents/Playground/project-1/.worktrees/feat/touch-gesture-overlay && npx tsc --noEmit
```

Expected: errors only on `CameraOverlay.tsx` (missing new props) — zero errors in ThreeARRenderer or useGarmentScene.

- [ ] **Step 10: Commit**

```bash
git add components/ar/ThreeARRenderer.tsx components/ar/useGarmentScene.ts
git commit -m "feat: add touch-capture, first-guide overlay, and adjustOffset support to ThreeARRenderer"
```

---

## Task 7: Update `CameraOverlay` — state, callbacks, button, resets

**Files:**
- Modify: `components/ar/CameraOverlay.tsx`

- [ ] **Step 1: Add new state and timer ref**

In `CameraOverlay`, after the existing state declarations (`const [mpStatus, setMpStatus]`), add:

```ts
  const [adjustOffset,           setAdjustOffset]           = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isAdjustMode,           setIsAdjustMode]           = useState(false);
  const [showFirstGuide,         setShowFirstGuide]         = useState(false);
  const [firstGuideHasBeenShown, setFirstGuideHasBeenShown] = useState(false);
  const adjustTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

- [ ] **Step 2: Add `startAdjustTimer` helper**

After `const stableStatus = ...`, add:

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

- [ ] **Step 4: Add `adjustTimerRef` cleanup to the existing cleanup `useEffect`**

Find the `useEffect` that stops camera tracks on unmount and add the timer cleanup:

```ts
  useEffect(() => {
    const alreadyGranted = localStorage.getItem(PERMISSION_KEY) === "true";
    if (alreadyGranted) {
      startCamera();
    } else {
      setCameraState("requesting");
    }
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (adjustTimerRef.current) clearTimeout(adjustTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

- [ ] **Step 5: Pass new props to `ThreeARRenderer`**

Find the `<ThreeARRenderer ... />` usage and replace it:

```tsx
        <ThreeARRenderer
          videoRef={videoRef}
          product={product}
          onStatus={stableStatus}
          adjustOffset={adjustOffset}
          isAdjustMode={isAdjustMode}
          showFirstGuide={showFirstGuide}
          onDrag={handleDrag}
          onFirstOverlay={handleFirstOverlay}
        />
```

- [ ] **Step 6: Add "Adjust fit" button**

In the live AR session JSX (`// ── Live AR session ─`), after the close button `</button>`, add:

```tsx
      {/* Adjust fit button — appears after first guide has been dismissed */}
      {firstGuideHasBeenShown && !showFirstGuide && !isAdjustMode && (
        <button
          onClick={() => {
            setIsAdjustMode(true);
            startAdjustTimer();
          }}
          className="absolute left-4 top-20 z-20 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm"
          aria-label="Adjust outfit fit"
        >
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
          </svg>
          <span className="text-xs font-semibold text-white">Adjust fit</span>
        </button>
      )}
```

Note: position is `top-20` (instead of `top-14` in CameraView) because `CameraOverlay` has the status pill at `top-14` and the close button at `top-12`.

- [ ] **Step 7: Type-check — expect clean**

```bash
cd /Users/harshitadandu/Documents/Playground/project-1/.worktrees/feat/touch-gesture-overlay && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 8: Commit**

```bash
git add components/ar/CameraOverlay.tsx
git commit -m "feat: add touch gesture overlay fine-tuning to CameraOverlay (3D path)"
```

---

## Task 8: Smoke test on the 3D path

**Files:** none — verification only

- [ ] **Step 1: Start dev server**

```bash
cd /Users/harshitadandu/Documents/Playground/project-1/.worktrees/feat/touch-gesture-overlay && npm run dev
```

Open `http://localhost:3000/looks` on a mobile device or Chrome DevTools with device emulation + touch.

- [ ] **Step 2: Verify first-guide flow**

1. Tap "Try On" on a product card
2. Grant camera access
3. Stand so the 3D garment renders (status pill shows detection)
4. Confirm drag guide appears (finger icon + arrows + "Drag to adjust fit")
5. Wait 3s — guide auto-dismisses
6. Confirm "Adjust fit" button appears

- [ ] **Step 3: Verify drag repositions 3D garment**

1. Tap "Adjust fit"
2. Drag up/down/left/right — confirm 3D garment moves accordingly
3. Verify direction is natural: drag right = garment moves right

- [ ] **Step 4: Verify reset on overlay close**

1. Drag garment off-centre
2. Close the overlay (✕ button)
3. Reopen "Try On" for the same product
4. Confirm offset is reset (garment at auto-detected position)

- [ ] **Step 5: Final commit if fixes needed**

```bash
git add -p
git commit -m "fix: 3D touch gesture smoke test corrections"
```
