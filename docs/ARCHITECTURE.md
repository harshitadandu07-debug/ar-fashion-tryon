## Architecture (MVP)

### App stages (state model)
- `entryMode`: `"poster"` | `"qr"`
- `cameraPermission`: `"idle"` | `"prompting"` | `"granted"` | `"denied"`
- `posterDetected`: boolean
- `selectedLookId`: string | null
- `experienceStage`: `"landing"` | `"detecting"` | `"browsing"` | `"tryon"` | `"result"`
- `looks`: array of look objects

### System modules
#### AR Session Manager
- decides whether app is in poster detection or face try-on
- handles transitions + cleanup between MindAR image and face sessions

#### Poster Tracker
- loads MindAR image target (`public/targets/poster.mind`)
- listens for detection events
- triggers UI unlock for browsing

#### Look Carousel
- renders swipeable look cards
- manages selection state

#### Face Try-On
- starts MindAR face tracking (front camera)
- applies selected overlay logic (glasses/headwear/etc.)
- supports switching looks without restarting the whole app

#### Capture / Share Utility
- captures AR output to image
- triggers save + share

### Folder structure (target)
```
project-1/
  app/
    page.tsx
    ar/page.tsx
  components/
    ar/
      PosterTracker.tsx
      FaceTryOn.tsx
      ARSessionManager.tsx
    ui/
      CameraPermission.tsx
      LookCard.tsx
      LookCarousel.tsx
      SaveShareBar.tsx
      LoadingState.tsx
  data/
    looks.json
  lib/
    ar/
      mindar-image.ts
      mindar-face.ts
    utils/
      capture.ts
      camera.ts
  public/
    targets/
      poster.mind
    assets/
      looks/
      overlays/
      thumbnails/
  types/
    look.ts
```

