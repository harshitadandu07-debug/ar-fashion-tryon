## Project Context: Web AR Fashion Try-On Experience (Double Take)

### Project overview
Build a **mobile-first WebAR experience** where a user scans a **poster** or opens via **QR code**, browses **Spring 2026 fashion trend cards**, taps a selected look, and activates a **live face try-on** view to see that look on themselves in real time. The user can **save or share** the result.

### Product goal
Create a polished, demoable WebAR fashion experience that combines:
1. Poster/image-triggered AR entry
2. Trend discovery UI
3. Face-based live try-on
4. Social saving/sharing

### Core user flow
#### Entry points
1) **Poster scan trigger**
- user points camera at a fashion poster
- poster is detected as an image target
- experience activates

2) **QR fallback**
- user scans QR code (on poster or online)
- web app opens directly
- user can continue into the same experience even if poster detection is skipped

#### In-experience flow
1. Open WebAR experience
2. Grant camera access
3. Detect poster image target OR enter via QR fallback
4. Browse **Spring 2026** trend cards
5. Tap a look
6. Switch to **front camera try-on mode**
7. Overlay selected look live
8. Switch looks, save screenshot, or share

## Phase 1: Locked product decisions
### 1) What triggers the AR?
- **Primary**: poster image (works for printed + on-screen posters)
- **Secondary**: QR fallback

### 2) What does the user do in AR?
- scan poster
- swipe trend cards
- tap look → live try-on
- save/share

> This is **not** generic object placement. It’s poster-triggered discovery → face try-on.

### 3) Success metrics
- **Primary**: first successful try-on rate
- **Secondary**: screenshots/shares, looks viewed/session, repeat usage

## MVP scope
### Must include
- open from URL
- camera permission flow (granted/denied states)
- poster target detection
- swipeable cards for Spring 2026 looks
- select a look
- face-based live overlay (simple accessory/effect)
- save screenshot
- share flow (when available)
- QR fallback entry

### Must avoid in v1
- full-body tracking
- cloth simulation / realistic garments
- user accounts
- CMS/admin
- complex backend
- native apps

## Technical direction (locked for v1)
- Next.js + React + Tailwind CSS
- MindAR (image + face)
- three.js
- static JSON data for looks
- deploy to Vercel

