## Project Title
AR Fashion Trend Discovery and Try-On Experience

## One-liner
Scan a fashion poster to discover seasonal looks in AR, then instantly preview a selected outfit on your body in real time.

## Problem Statement
Users are exposed to too many fashion choices across different platforms without enough structure or clarity. They are often unsure which trends are relevant for the season and have limited ways to quickly visualize how an outfit would look on their own body before trying or buying it.

## How Might We
How might we create an interactive experience that helps users explore current fashion trends and instantly visualize selected outfits on themselves in real time?

## Target Users
- Young adults (18–30) who follow fashion trends online
- Trend-driven seasonal shoppers
- Online shoppers who want to visualize before buying
- Social-media-first users who prefer fast, visual, interactive experiences

## Key Research Insights (used as requirements)
- Photo uploads can distort body shape → prefer **real-time** try-on
- Overlays misalign → prioritize **stable, smooth alignment** over photorealism
- Subtle “adjusting” feedback increases trust
- Minimal guidance beats heavy instruction

## Core Concept
Smartphone AR experience that begins with **marker recognition** (poster) and transitions into **real-time body tracking** try-on.

## Primary User Journey (happy path)
1. Open experience
2. Back camera scans spring fashion poster
3. Poster recognized (marker lock + feedback)
4. Trend cards appear anchored near the poster
5. Swipe through trends, tap to select a look
6. Tap “Try on” → transition
7. Switch to front camera + framing guide
8. Outfit overlay appears and adjusts with movement
9. Save/share or return to browse

## MVP Scope (Must have)
- Marker recognition via a fashion poster
- AR display of swipeable trend cards (AR-anchored or screen-space UI)
- Tap to select a look
- Smooth transition: poster mode → try-on mode
- Real-time outfit overlay aligned to body landmarks (upper-body focus in v1)
- Light guidance for framing + fitting feedback
- Screenshot/save/share (simple)

## Out of Scope (v1)
- Photoreal cloth simulation
- Perfect garment fit / tailoring-level accuracy
- Complex occlusion (e.g., hands in front of garment)
- Deep personalization (body measurement calibration)
- Full commerce integration (buy flow)

## Design Principles
- Clean visuals, low cognitive load
- Minimal text; rely on icons + motion cues
- Clear scanning + loading + fitting feedback
- Smooth and obvious transitions between modes
- Stability > realism in early versions

## Expected Screens / States
See `docs/Screens-and-States.md`.

## Success Criteria (MVP)
- Marker scan works reliably (low frustration)
- Trend browsing feels simple and delightful
- Try-on transition feels smooth
- Try-on overlay is believable enough to demonstrate value
- Users understand what to do with minimal instruction

## Open Questions (to resolve during build)
- Trend cards as **AR-anchored** vs **screen-space overlay** (tradeoff: immersion vs UI stability)
- Outfit assets format and pipeline (2D overlays vs 3D garments)
- Body tracking approach (platform APIs vs ML pose)

