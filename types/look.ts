export type OverlayType =
  | "glasses"
  | "headwear"
  | "makeup"
  | "jewelry"
  | "effect";

export type Look = {
  id: string;
  name: string;
  thumbnail: string;
  description: string;
  overlayType: OverlayType;
  overlayAsset: string;
};

