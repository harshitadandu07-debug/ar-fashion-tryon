# Wrist Tracking Overlay Control

**Date:** 2026-04-26
**Status:** Approved

## Overview

When the user taps "Adjust fit", MediaPipe wrist landmarks drive the outfit overlay offset instead of screen touch. Moving either arm shifts the garment; the session auto-exits after 3 seconds of no significant movement.

## Decisions

| Question | Decision |
|---|---|
| Activation | Only when `isAdjustMode = true` (tap "Adjust fit" button) |
| Gesture | Delta from entry-baseline (not absolute position mapping) |
| Which wrist | Whichever has moved further from its baseline (automatic) |
| Screen touch | Removed — wrist is the sole input |
| Deadzone | 2.5% of frame width in normalised units (`0.025`) |

## User Flow

1. Outfit renders on body → first-guide fires → "Move your arm to adjust" overlay appears
2. User moves either arm → overlay shifts with arm movement → guide auto-dismisses
3. 3 seconds of no wrist movement past deadzone → adjust mode exits → "Adjust fit" button reappears
4. Tap "Adjust fit" → same wrist-tracking session

## Architecture

All changes are in `ThreeARRenderer.tsx`. No other files change.

`ThreeARRenderer` already has:
- `torsoRef` — updated every frame from `usePoseTorso`, contains `lWrist`/`rWrist`
- `isAdjustMode` prop → new `isAdjustModeRef` mirrors it for the RAF loop
- `onDrag(dx, dy)` callback → unchanged interface; wrist deltas feed it

Screen touch handlers removed: `handleTouchStart`, `handleTouchMove`, `handleTouchEnd`, `touchCaptureRef`, and the non-passive `touchmove` listener `useEffect`. The touch-capture div becomes a display-only div (no event handlers).

## New Refs

```ts
isAdjustModeRef:   boolean                          // mirrors isAdjustMode prop for RAF loop
wristBaselineRef:  { lWrist: TorsoPoint; rWrist: TorsoPoint } | null  // snapshotted on activation
prevWristRef:      TorsoPoint | null                // dominant wrist from previous frame
```

## Activation / Deactivation

```ts
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
    prevWristRef.current = null;
  }
}, [isAdjustMode]);
```

## RAF Loop Algorithm

Constants:
```ts
const WRIST_DEADZONE = 0.025; // normalised units — 2.5% of frame width
```

Each frame, inside the `if (video.readyState >= 2)` block, after `updateScene`:

```
if isAdjustModeRef && wristBaselineRef && torso has lWrist/rWrist:

  lDist = hypot(lWrist - baseline.lWrist)
  rDist = hypot(rWrist - baseline.rWrist)
  dominant = lDist > rDist ? lWrist : rWrist

  totalDisp = hypot(dominant - its baseline)
  if totalDisp < WRIST_DEADZONE:
    prevWristRef = null   // reset so no jump when user re-engages
    skip

  if prevWristRef is not null:
    dx_norm = -(dominant.x - prevWristRef.x)   // negate: mirrored video
    dy_norm =  (dominant.y - prevWristRef.y)
    onDragRef.current(dx_norm * W, dy_norm * H)

  prevWristRef = dominant
```

## Coordinate Conversion

- `dx_px = -(Δwrist.x) * W` — x negated because the video feed is mirrored; physical right = MediaPipe x-decrease = screen right
- `dy_px = Δwrist.y * H` — y unchanged; MediaPipe y increases downward matching screen y; Three.js y-inversion is applied downstream in `updateScene`

## Guide Text Update

Change "Touch screen & drag to adjust" → "Move your arm to adjust" in the first-guide overlay and "Touch screen & drag to reposition" → "Move your arm to reposition" in the adjust-mode banner.

## Files Changed

| File | Change |
|---|---|
| `components/ar/ThreeARRenderer.tsx` | Add 3 refs, activation effect, RAF wrist-tracking block, remove all touch handlers, update guide text |

## Edge Cases

- **Wrist null** (arm out of frame): skip frame; `prevWristRef = null` so no delta jump when arm returns
- **Switch arms mid-session**: dominant wrist flips automatically as the other arm exceeds the first's baseline displacement
- **Confidence drops**: `torsoRef.current.lWrist`/`rWrist` may be null; RAF guard skips cleanly
- **Baseline not captured** (wrists not visible when button tapped): `wristBaselineRef` stays null; tracking disabled for that session until re-tapped
