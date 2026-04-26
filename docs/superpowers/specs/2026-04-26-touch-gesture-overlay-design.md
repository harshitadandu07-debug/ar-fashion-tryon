# Touch Gesture Overlay Fine-Tuning

**Date:** 2026-04-26
**Status:** Approved

## Overview

After the outfit overlay appears on the user's body, they can fine-tune its position using a one-finger drag gesture. The system auto-prompts on first appearance and provides a persistent re-entry button.

## Decisions

| Question | Decision |
|---|---|
| Gestures | Drag only (translate x/y) |
| Activation | Toggle button + auto-prompt on first overlay |
| Persistence | Resets to zero on outfit switch or camera flip |
| Exit | Auto-exit after 3s idle; also exits on first drag completion |

## User Flow

1. Outfit confidence crosses threshold → first-time guide appears centred on garment ("Drag to adjust fit" + finger icon + directional arrows)
2. User drags → garment shifts → guide dismisses → adjust mode auto-exits after 3s of no touch
3. "Adjust fit" pill button (top-left, below status pill) appears after first guide dismisses
4. Tap button → adjust mode re-enters → same 3s auto-exit

## Architecture

State lives in `CameraView` (consistent with existing pattern). `TryOnRenderer` handles touch capture and rendering. `drawGarmentAffine` applies the offset.

### New state in CameraView

```ts
adjustOffset:   { x: number; y: number }  // canvas-pixel delta; resets on outfit/camera switch
isAdjustMode:   boolean                    // touch-capture div is active
showFirstGuide: boolean                    // one-time drag hint is visible
adjustTimerRef: RefObject<ReturnType<typeof setTimeout>>
```

### New props on TryOnRenderer

```ts
adjustOffset:    { x: number; y: number }
isAdjustMode:    boolean
showFirstGuide:  boolean
onDrag:          (dx: number, dy: number) => void   // deltas already scaled to canvas pixels
onFirstOverlay:  () => void                          // fires once per outfit when confidence first crosses threshold
```

### Data flow

```
CameraView
  ├── state: adjustOffset, isAdjustMode, showFirstGuide, adjustTimerRef
  ├── onFirstOverlay() → showFirstGuide=true, isAdjustMode=true, start 3s timer
  ├── onDrag(dx,dy)   → adjustOffset += delta, reset 3s timer
  ├── timer fires     → isAdjustMode=false, showFirstGuide=false
  ├── "Adjust fit" tap → isAdjustMode=true, start 3s timer
  └── activeIndex / facingMode change → reset adjustOffset, clear timer, exit mode

TryOnRenderer (receives props above)
  ├── hasTriggeredFirstOverlay ref — reset on activeIndex change
  ├── fires onFirstOverlay() once when confidence >= threshold AND garmentRef.current !== null
  ├── touch-capture div (absolute inset-0 z-10) rendered when isAdjustMode || showFirstGuide
  │     onTouchMove: delta = (touch - lastTouch) * (canvas.width / canvas.getBoundingClientRect().width)
  │     calls onDrag(scaledDx, scaledDy)
  └── passes adjustOffset to drawGarmentAffine via ref in RAF loop

canvasWarp.ts — drawGarmentAffine
  └── new param: adjustOffset?: { x: number; y: number }
      ctx.translate(midX + (adjustOffset?.x ?? 0), midY + (adjustOffset?.y ?? 0))
```

## Files Changed

| File | Change |
|---|---|
| `components/ar/canvasWarp.ts` | Add optional `adjustOffset` param to `drawGarmentAffine` |
| `components/ar/TryOnRenderer.tsx` | New props, touch-capture div, first-guide overlay UI, `onFirstOverlay` trigger logic |
| `components/ar/CameraView.tsx` | New state, "Adjust fit" button, timer logic, reset on index/camera change |

## UI Details

- **First guide:** centred on garment area, four directional arrows around a finger icon, "Drag to adjust fit" pill label, "Dismisses automatically" sub-label
- **"Adjust fit" button:** `absolute left-4 top-14 z-20`, pill style matching existing controls (`bg-black/40 backdrop-blur-sm`), visible only after first guide has dismissed and garment is showing
- **Adjust mode active (via button):** subtle dashed border around garment signals drag is live

## Edge Cases

- **Confidence drops mid-drag:** garment hides as normal; offset is preserved and reapplied when confidence returns
- **Camera flip:** `toggleCamera` resets `adjustOffset` to `{0,0}` and clears adjust mode
- **Outfit switch:** `activeIndex` change `useEffect` resets offset, clears timer, exits mode synchronously
- **No garment rendered (non-upper-body category):** `onFirstOverlay` only fires when `garmentRef.current !== null`, preventing guide from showing when no overlay is drawn
- **Touch/card swipe conflict:** touch-capture div is `z-10`; product cards are `z-20` — card swipes unaffected
