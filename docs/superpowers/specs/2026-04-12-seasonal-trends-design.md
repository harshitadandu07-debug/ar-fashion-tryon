# Seasonal Trend Images — Design Spec

## Goal
Replace hardcoded product data in the AR try-on app with manually curated, per-season trend JSON files. A local script generates editorial outfit images via HuggingFace Stable Diffusion and saves them as static assets. The app detects the current season and loads the correct data at build time.

---

## Architecture

**Option chosen: B — Per-season JSON files**

Each season is fully self-contained. Editing one season cannot affect another. The image generation script targets a single season at a time via a `--season` flag.

---

## Data Structure

### Season JSON — `data/seasons/<season>.json`

One file per season: `spring.json`, `summer.json`, `fall.json`, `winter.json`

```json
{
  "season": "spring",
  "year": 2026,
  "trends": [
    {
      "id": 1,
      "category": "Spring 2026",
      "name": "Linen Trench Coat",
      "description": "Beige — Oversized fit",
      "price": "$320",
      "imagePrompt": "editorial fashion photo, oversized beige linen trench coat, spring daylight, minimalist white background, model facing forward",
      "imagePath": "/seasons/spring/linen-trench-coat.jpg"
    }
  ]
}
```

Fields:
- `name`, `description`, `price`, `category` — manually filled from trend research
- `imagePrompt` — manually written editorial prompt for SD image generation
- `imagePath` — path under `public/` where the generated image will be saved (manually set to match the slug)

### Image Storage — `public/seasons/<season>/<slug>.jpg`

Images are committed to git and served as Vercel static assets. No CDN setup required.

---

## Season Detection

File: `lib/season.ts`

Returns the current season string based on today's date:

| Season | Date Range |
|--------|-----------|
| Spring | Mar 1 – May 14 |
| Summer | May 15 – Aug 31 |
| Fall   | Sep 1 – Nov 30 |
| Winter | Dec 1 – Feb 28/29 |

Returns: `"spring" | "summer" | "fall" | "winter"`

---

## Image Generation Script

File: `scripts/generate-images.ts`

Run with:
```bash
npm run generate-images -- --season spring
```

Steps:
1. Reads `data/seasons/<season>.json`
2. For each trend item, calls HuggingFace Inference API (`stabilityai/stable-diffusion-2-1`) with the `imagePrompt`
3. Saves the response image buffer to `public/seasons/<season>/<slug>.jpg`
4. Skips items where the image file already exists (unless `--force` flag is passed)

Auth: `HUGGINGFACE_TOKEN` from `.env.local`

HuggingFace free tier supports ~10 requests before rate limiting — sufficient for 5 trends per season with room to regenerate individual images.

---

## App Integration

### `lib/season.ts` (new)
Exports `getCurrentSeason()` — returns the current season string.

### `data/seasons/spring.json` (new)
Manually curated Spring 2026 trends. Migrate the existing 5 hardcoded products from `CameraView.tsx` as the starting point.

### `components/ui/ProductCard.tsx` (modify)
- Add `image?: string` to the `Product` type
- Replace the `img` placeholder div with `<img src={product.image} ... />` when image is present, fallback to placeholder when not

### `components/ar/CameraView.tsx` (modify)
- Remove hardcoded `PRODUCTS` array
- Import current season JSON using `getCurrentSeason()`
- Map JSON `trends` array to `Product[]` type

### `package.json` (modify)
Add script:
```json
"generate-images": "npx ts-node --project tsconfig.json scripts/generate-images.ts"
```

### `.env.local` (new, gitignored)
```
HUGGINGFACE_TOKEN=your_token_here
```

---

## Workflow

1. Research trends on Google Trends, Pinterest Trends, fashion magazines
2. Edit `data/seasons/<season>.json` with trend themes and image prompts
3. Run `npm run generate-images -- --season <season>`
4. Commit JSON files + generated images under `public/seasons/`
5. Push to GitHub → Vercel deploys with baked-in static images

---

## Out of Scope
- Automated trend fetching (Pinterest API, Google Trends API)
- Runtime image generation
- CDN / Vercel Blob storage
- Rainy season (not a standard meteorological season)
