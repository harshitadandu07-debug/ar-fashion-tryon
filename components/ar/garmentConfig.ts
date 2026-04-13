// components/ar/garmentConfig.ts
export type GarmentAnchor = {
  leftShoulder:  { x: number; y: number };
  rightShoulder: { x: number; y: number };
  leftHip:       { x: number; y: number };
  rightHip:      { x: number; y: number };
};

export type GarmentCalibration = {
  widthMultiplier:  number;
  heightMultiplier: number;
  xOffset:          number;
  yOffset:          number;
};

export type GarmentType = "upper" | "lower" | "full";

export type GarmentConfig = {
  productId:         number;
  category:          "upper-body" | "lower-body" | "full-body" | "other";
  overlayAsset:      string;
  modelPath:         string;
  garmentType:       GarmentType;
  widthMultiplier3d: number;
  yOffset3d:         number;
  anchors:           GarmentAnchor;
  calibration:       GarmentCalibration;
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
    productId:         1,
    category:          "upper-body",
    overlayAsset:      "/seasons/spring/linen-trench-coat.jpg",
    modelPath:         "/models/jacket.glb",
    garmentType:       "upper",
    widthMultiplier3d: 1.8,
    yOffset3d:         0,
    anchors:           DEFAULT_ANCHORS,
    calibration:       { widthMultiplier: 1.8, heightMultiplier: 3.0, xOffset: 0, yOffset: -0.05 },
  },
  2: {
    productId:         2,
    category:          "full-body",
    overlayAsset:      "/seasons/spring/cotton-shirt.jpg",
    modelPath:         "/models/dress.glb",
    garmentType:       "full",
    widthMultiplier3d: 1.6,
    yOffset3d:         0,
    anchors:           DEFAULT_ANCHORS,
    calibration:       DEFAULT_CALIBRATION,
  },
};

export function getGarmentConfig(productId: number): GarmentConfig | null {
  return GARMENT_CONFIGS[productId] ?? null;
}
