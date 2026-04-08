## Build / run (MVP)

This repo is currently a **scaffold** for the WebAR MVP.

### Next step: initialize the Next.js app
From `project-1/`:

```bash
# creates package.json + app shell (App Router)
npx create-next-app@latest . --ts --app --tailwind --eslint --src-dir=false --import-alias "@/*"
```

Then install WebAR deps:

```bash
npm install three
```

MindAR options depend on which package you choose (we’ll wire this next):
- `mind-ar` (if available via npm), or
- include MindAR build files and import them client-side

### Run locally
```bash
npm run dev
```

### What you’ll implement next
- `app/page.tsx`: landing page
- `app/ar/page.tsx`: AR experience (permissions → detect/browse → try-on)
- Wire MindAR sessions in:
  - `lib/ar/mindar-image.ts`
  - `lib/ar/mindar-face.ts`

