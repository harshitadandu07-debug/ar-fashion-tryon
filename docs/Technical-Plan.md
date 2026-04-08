## MVP technical plan (implementation-agnostic)

This doc describes the build as two modes:
1) **Poster mode**: marker detection + anchored trend cards (back camera)
2) **Try-on mode**: body tracking + outfit overlay (front camera)

## Mode 1: Poster / marker recognition
### Responsibilities
- Acquire camera feed (back camera)
- Detect known image marker (the poster)
- Establish a stable anchor pose for AR content
- Render anchored content (trend cards / selection)

### Inputs
- Poster marker image(s) in `assets/poster/`

### Outputs
- Marker pose / anchor transform
- UI state: searching → found → locked

## Mode 2: Try-on (pose/body tracking)
### Responsibilities
- Acquire camera feed (front camera)
- Run pose / body landmark tracking
- Place outfit overlay aligned to torso landmarks (upper-body focus)
- Apply smoothing + confidence gating to reduce jitter

### Inputs
- Outfit overlays in `assets/outfits/` (initially 2D PNG with transparency)

### Outputs
- On-screen composite (camera + overlay)
- UI state: framing → fitting → ready

## Core data model (suggested)
- `TrendLook`: id, name, season, tags, thumbnail, assetRefs
- `Marker`: id, imageRef, sizeHint, detectionConfig
- `TryOnAsset`: lookId, overlayPng, anchorLandmarks, offsets, scaleRules

## Smoothing + confidence (MVP)
- Use exponential smoothing on landmark positions
- Only update overlay when confidence is above threshold
- When confidence dips, show “Adjusting…” and reduce movement

## Asset pipeline (MVP-friendly)
- Prefer **upper-body tops/jackets** first
- Each look needs:
  - card thumbnail (square)
  - try-on overlay PNG (transparent)
  - alignment metadata (shoulder width scaling, torso center offset)

## Platform choices (pick one when we start building)
### Option A: Web prototype (fast iteration)
- Marker recognition via web AR libraries + WebXR where possible
- Pose estimation via in-browser ML (heavier, but quick to prototype)
- Pros: fastest iteration, easiest sharing
- Cons: iOS WebXR constraints, performance limits

### Option B: Native mobile (most reliable experience)
- iOS: ARKit image anchors + body tracking (where available)
- Android: ARCore augmented images + pose tracking
- Pros: better tracking + performance, better camera control
- Cons: more setup

## MVP build milestones
- Poster mode: marker detection + anchored cards
- Look selection
- Transition to try-on
- Try-on overlay with stable smoothing
- Save/share

