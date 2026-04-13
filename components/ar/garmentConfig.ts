export type GarmentAnchor = {
  // Normalized 0–1 coords within the garment image itself.
  leftShoulder:  { x: number; y: number };
  rightShoulder: { x: number; y: number };
  leftHip:       { x: number; y: number };
  rightHip:      { x: number; y: number };
};

export type GarmentCalibration = {
  widthMultiplier:  number;  // multiply detected shoulder-width by this
  heightMultiplier: number;  // multiply detected torso-height by this
  xOffset:          number;  // fractional offset of draw origin relative to draw width
  yOffset:          number;  // fractional offset of draw origin relative to draw height (negative = up)
};

export type GarmentConfig = {
  productId:    number;
  category:     "upper-body" | "other"; // only "upper-body" gets AR try-on
  overlayAsset: string;                 // path to transparent/white-bg PNG for try-on
  anchors:      GarmentAnchor;
  calibration:  GarmentCalibration;
};

const DEFAULT_ANCHORS: GarmentAnchor = {
  leftShoulder:  { x: 0.22, y: 0.10 },
  rightShoulder: { x: 0.78, y: 0.10 },
  leftHip:       { x: 0.22, y: 0.70 },
  rightHip:      { x: 0.78, y: 0.70 },
};

const DEFAULT_CALIBRATION: GarmentCalibration = {
  widthMultiplier:  1.6,
  heightMultiplier: 2.2,
  xOffset:          0,
  yOffset:          -0.08,
};

export const GARMENT_CONFIGS: Record<number, GarmentConfig> = {
  1: {
    productId: 1,
    category: "upper-body",
    overlayAsset: "/seasons/spring/linen-trench-coat.jpg",
    anchors: DEFAULT_ANCHORS,
    calibration: { widthMultiplier: 1.8, heightMultiplier: 3.0, xOffset: 0, yOffset: -0.05 },
  },
  2: {
    productId: 2,
    category: "other",
    overlayAsset: "/seasons/spring/silk-slip-dress.jpg",
    anchors: DEFAULT_ANCHORS,
    calibration: DEFAULT_CALIBRATION,
  },
  3: {
    productId: 3,
    category: "other",
    overlayAsset: "/seasons/spring/brooches-set.jpg",
    anchors: DEFAULT_ANCHORS,
    calibration: DEFAULT_CALIBRATION,
  },
  4: {
    productId: 4,
    category: "other",
    overlayAsset: "/seasons/spring/wide-leg-trousers.jpg",
    anchors: DEFAULT_ANCHORS,
    calibration: DEFAULT_CALIBRATION,
  },
  5: {
    productId: 5,
    category: "upper-body",
    overlayAsset: "/seasons/spring/knit-cardigan.jpg",
    anchors: DEFAULT_ANCHORS,
    calibration: { widthMultiplier: 1.55, heightMultiplier: 2.0, xOffset: 0, yOffset: -0.06 },
  },
  6: {
    productId: 6,
    category: "upper-body",
    overlayAsset: "/seasons/spring/linen-blazer.jpg",
    anchors: DEFAULT_ANCHORS,
    calibration: { widthMultiplier: 1.65, heightMultiplier: 2.1, xOffset: 0, yOffset: -0.07 },
  },
  7: {
    productId: 7,
    category: "upper-body",
    overlayAsset: "/seasons/spring/cotton-shirt.jpg",
    anchors: DEFAULT_ANCHORS,
    calibration: DEFAULT_CALIBRATION,
  },
};

export function getGarmentConfig(productId: number): GarmentConfig | null {
  return GARMENT_CONFIGS[productId] ?? null;
}
