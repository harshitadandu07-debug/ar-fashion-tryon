import type { TorsoPoints } from "./usePoseTorso";
import type { GarmentCalibration } from "./garmentConfig";

/**
 * Draw a garment image onto ctx using an affine transform derived from
 * the detected torso quad.
 *
 * @param ctx        - 2D canvas context to draw onto (already has video underneath)
 * @param img        - garment image source (HTMLImageElement or OffscreenCanvas with white bg removed)
 * @param torso      - smoothed TorsoPoints in normalised 0–1 coords
 * @param calibration - per-garment width/height multipliers and offsets
 * @param canvasW    - canvas width in pixels
 * @param canvasH    - canvas height in pixels
 * @param alpha      - global draw opacity (0–1, used to fade when confidence is low)
 */
export function drawGarmentAffine(
  ctx:          CanvasRenderingContext2D,
  img:          CanvasImageSource,
  torso:        TorsoPoints,
  calibration:  GarmentCalibration,
  canvasW:      number,
  canvasH:      number,
  alpha = 1,
  adjustOffset: { x: number; y: number } = { x: 0, y: 0 },
): void {
  const { lShoulder, rShoulder, lHip, rHip } = torso;

  // Convert normalised coords to canvas pixels
  const lsX = lShoulder.x * canvasW,  lsY = lShoulder.y * canvasH;
  const rsX = rShoulder.x * canvasW,  rsY = rShoulder.y * canvasH;
  const lhX = lHip.x      * canvasW,  lhY = lHip.y      * canvasH;
  const rhX = rHip.x      * canvasW,  rhY = rHip.y      * canvasH;

  // Shoulder midpoint — origin of our drawing transform
  const midX = (lsX + rsX) / 2;
  const midY = (lsY + rsY) / 2;

  // Shoulder span (px) — drives garment width
  const shoulderSpan = Math.hypot(rsX - lsX, rsY - lsY);

  // Torso height (px, shoulder mid → hip mid)
  const hipMidX  = (lhX + rhX) / 2;
  const hipMidY  = (lhY + rhY) / 2;
  const torsoH   = Math.hypot(hipMidX - midX, hipMidY - midY);

  // Tilt angle — computed from lShoulder→rShoulder direction.
  // In selfieMode, x increases screen-left, so lsX > rsX; swapping operands
  // gives ~0 for level shoulders instead of ~π (which would flip the garment).
  const angle = Math.atan2(lsY - rsY, lsX - rsX);

  // Final draw dimensions
  const drawW = shoulderSpan * calibration.widthMultiplier;
  const drawH = torsoH       * calibration.heightMultiplier;

  // xOffset/yOffset are fractions of drawW/drawH applied before rotation
  const offX = calibration.xOffset * drawW;
  const offY = calibration.yOffset * drawH;

  const clampedAlpha = Math.max(0, Math.min(1, alpha));

  ctx.save();
  ctx.globalAlpha = clampedAlpha;

  // Move to shoulder midpoint, rotate, mirror to match selfie camera view, draw
  ctx.translate(midX + adjustOffset.x, midY + adjustOffset.y);
  ctx.rotate(angle);
  ctx.scale(-1, 1); // flip horizontally — garment image is front-facing; selfie view needs mirror
  ctx.drawImage(
    img,
    -drawW / 2 + offX,   // left edge (after scale, this maps to screen-right)
    offY,                  // top edge starts just above shoulders (offY is negative)
    drawW,
    drawH,
  );

  ctx.restore();
}

/**
 * Remove near-white pixels from an image and return an OffscreenCanvas
 * ready to use as a CanvasImageSource. Returns null if the image src is empty.
 */
export async function removeWhiteBackground(src: string): Promise<OffscreenCanvas | null> {
  return new Promise((resolve) => {
    if (!src) { resolve(null); return; }

    // Note: HTMLImageElement loading is main-thread only; not Worker-compatible
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onerror = () => resolve(null);
    img.onload = () => {
      const off = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
      const ctx = off.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const id   = ctx.getImageData(0, 0, off.width, off.height);
      const data = id.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        // Luminance-weighted: better preserves light-coloured garments than simple average
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        if (brightness > 240) {
          data[i + 3] = 0;
        } else if (brightness > 210) {
          data[i + 3] = Math.round(((255 - brightness) / 45) * 255);
        }
      }
      ctx.putImageData(id, 0, 0);
      resolve(off);
    };
    img.src = src;
  });
}
