# Wrist Tracking Overlay Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace screen-touch drag with MediaPipe wrist-delta tracking to control the AR outfit overlay offset, active only when `isAdjustMode = true`.

**Architecture:** All changes in `ThreeARRenderer.tsx`. Three new refs (`isAdjustModeRef`, `wristBaselineRef`, `prevWristRef`) feed a wrist-tracking block inside the existing RAF loop. All touch handlers and the non-passive listener effect are removed. The `onDrag` callback interface is unchanged — wrist deltas flow through the same pipe as touch deltas did.

**Tech Stack:** React 19, TypeScript, MediaPipe Pose (via `usePoseTorso`), canvas 2D RAF loop

---

## File Map

| File | Change |
|---|---|
| `components/ar/ThreeARRenderer.tsx` | Add wrist refs + activation effect + RAF tracking block; remove all touch code; update guide text |

---

## Task 1: Replace touch drag with wrist tracking in ThreeARRenderer

**Files:**
- Modify: `components/ar/ThreeARRenderer.tsx`

- [ ] **Step 1: Add `TorsoPoint` to the import**

The new refs use `TorsoPoint`. Add it to the existing import:

```ts
import { usePoseTorso } from "@/components/ar/usePoseTorso";
import type { TorsoPoint } from "@/components/ar/usePoseTorso";
```

- [ ] **Step 2: Add the deadzone constant below `CONFIDENCE_THRESHOLD`**

```ts
const CONFIDENCE_THRESHOLD = 0.55;
const WRIST_DEADZONE       = 0.025; // normalised units — 2.5% of frame width filters body sway
```

- [ ] **Step 3: Replace the touch refs with wrist refs**

Remove these three lines:
```ts
  const lastTouchRef             = useRef<{ x: number; y: number } | null>(null);
  const touchCaptureRef          = useRef<HTMLDivElement>(null);
```

Replace with:
```ts
  const isAdjustModeRef  = useRef(isAdjustMode);
  const wristBaselineRef = useRef<{ lWrist: TorsoPoint; rWrist: TorsoPoint } | null>(null);
  const prevWristRef     = useRef<TorsoPoint | null>(null);
```

- [ ] **Step 4: Remove the non-passive touchmove listener effect**

Delete the entire block (currently after the sync effects, before `usePoseTorso`):

```ts
  // Prevent iOS Safari from stealing the touch for page scroll during drag
  useEffect(() => {
    if (!isAdjustMode && !showFirstGuide) return;
    const el = touchCaptureRef.current;
    if (!el) return;
    const prevent = (e: TouchEvent) => { e.preventDefault(); };
    el.addEventListener("touchmove", prevent, { passive: false });
    return () => el.removeEventListener("touchmove", prevent);
  }, [isAdjustMode, showFirstGuide]);
```

- [ ] **Step 5: Add the wrist baseline activation effect**

Add this AFTER the `confidenceRef` sync effect (after `useEffect(() => { confidenceRef.current = confidence; }, [confidence]);`) — it must come after `torsoRef` is declared to avoid a TypeScript "used before declaration" error:

```ts
  // Snapshot wrist baseline when adjust mode activates; clear refs on deactivation
  useEffect(() => {
    isAdjustModeRef.current = isAdjustMode;
    if (isAdjustMode) {
      const t = torsoRef.current;
      if (t?.lWrist && t?.rWrist) {
        wristBaselineRef.current = { lWrist: t.lWrist, rWrist: t.rWrist };
      }
      prevWristRef.current = null;
    } else {
      wristBaselineRef.current = null;
      prevWristRef.current     = null;
    }
  }, [isAdjustMode]);
```

Note: `torsoRef` is used inside the effect body but intentionally omitted from deps — it's a ref, always current, and we only want this to run when `isAdjustMode` changes.

- [ ] **Step 6: Add wrist tracking block inside the RAF loop**

Inside the `render` function, after the `updateScene(...)` call and the first-overlay trigger block, add:

```ts
        // ── Wrist tracking (adjust mode only) ─────────────────────────
        const baseline = wristBaselineRef.current;
        const t        = torsoRef.current;
        if (
          isAdjustModeRef.current &&
          baseline &&
          t?.lWrist &&
          t?.rWrist
        ) {
          const { lWrist, rWrist } = t;
          const lDist = Math.hypot(
            lWrist.x - baseline.lWrist.x,
            lWrist.y - baseline.lWrist.y,
          );
          const rDist = Math.hypot(
            rWrist.x - baseline.rWrist.x,
            rWrist.y - baseline.rWrist.y,
          );
          const dominant     = lDist > rDist ? lWrist : rWrist;
          const dominantBase = lDist > rDist ? baseline.lWrist : baseline.rWrist;
          const totalDisp    = Math.hypot(
            dominant.x - dominantBase.x,
            dominant.y - dominantBase.y,
          );

          if (totalDisp < WRIST_DEADZONE) {
            // Inside deadzone — reset prev so no jump when user re-engages
            prevWristRef.current = null;
          } else {
            const prev = prevWristRef.current;
            if (prev) {
              // Negate x: mirrored video — physical right = MediaPipe x-decrease = screen right
              const dx = -(dominant.x - prev.x) * W;
              const dy =  (dominant.y - prev.y) * H;
              onDragRef.current(dx, dy);
            }
            prevWristRef.current = dominant;
          }
        }
```

- [ ] **Step 7: Remove the three touch handler functions**

Delete these entire blocks:

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

- [ ] **Step 8: Remove touch handlers and ref from the capture div in JSX**

Find the touch-capture div opening tag and replace it (remove `ref`, `onTouchStart`, `onTouchMove`, `onTouchEnd`, `onTouchCancel`):

```tsx
      {/* Adjust mode overlay — active during adjust mode or first guide */}
      {(isAdjustMode || showFirstGuide) && (
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          aria-hidden="true"
        >
```

- [ ] **Step 9: Update guide text**

Change "Touch screen & drag to adjust":
```tsx
                  <span className="text-xs font-semibold text-white">Move your arm to adjust</span>
```

Change "Touch screen & drag to reposition":
```tsx
              <span className="text-xs text-white/80">Move your arm to reposition</span>
```

- [ ] **Step 10: Type-check**

```bash
cd /Users/harshitadandu/Documents/Playground/project-1/.worktrees/feat/touch-gesture-overlay && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 11: Commit**

```bash
git add components/ar/ThreeARRenderer.tsx
git commit -m "feat: replace touch drag with wrist tracking for overlay adjustment"
```

---

## Task 2: Smoke test wrist tracking

**Files:** none — verification only

- [ ] **Step 1: Start dev server**

```bash
cd /Users/harshitadandu/Documents/Playground/project-1/.worktrees/feat/touch-gesture-overlay && npm run dev
```

Open `http://localhost:3000/looks` on a device with camera.

- [ ] **Step 2: Verify first-guide flow**

1. Tap "Try On" → grant camera → stand until garment renders
2. Confirm "Move your arm to adjust" guide appears
3. Keep arms still for 3s → confirm guide auto-dismisses
4. Confirm "Adjust fit" button appears top-left

- [ ] **Step 3: Verify wrist tracking**

1. Tap "Adjust fit"
2. Raise either arm and move it left/right/up/down
3. Garment overlay should follow arm movement
4. Lower arm back to resting → movement stops (deadzone kicks in)
5. Hold arm still for 3s → "Adjust fit" button reappears

- [ ] **Step 4: Verify direction**

1. Move right arm to your right → garment should shift right on screen
2. Move arm upward → garment should shift upward
3. If direction is inverted, the x-negate sign needs flipping — note it and report

- [ ] **Step 5: Final commit if any calibration fixes needed**

```bash
git add components/ar/garmentConfig.ts components/ar/ThreeARRenderer.tsx
git commit -m "fix: wrist tracking direction and deadzone calibration"
```
