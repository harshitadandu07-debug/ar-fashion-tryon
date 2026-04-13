// components/ar/landmarkToTransform.ts
import * as THREE from "three";
import type { TorsoPoints } from "./usePoseTorso";

/** Convert a normalised 0–1 landmark to Three.js world coords (ortho camera, 1 unit = 1 px) */
export function lmToWorld(
  pt: { x: number; y: number },
  W: number,
  H: number,
): THREE.Vector3 {
  return new THREE.Vector3(
    pt.x * W - W / 2,
    H / 2 - pt.y * H,
    0,
  );
}

export type GarmentTransform = {
  position: THREE.Vector3;
  rotationZ: number;
  scaleFactor: number;
  spanPx: number;
};

export function upperBodyTransform(
  torso: TorsoPoints,
  W: number,
  H: number,
  widthMultiplier: number,
): GarmentTransform {
  const ls = lmToWorld(torso.lShoulder, W, H);
  const rs = lmToWorld(torso.rShoulder, W, H);

  const position = new THREE.Vector3()
    .addVectors(ls, rs)
    .multiplyScalar(0.5);

  const rotationZ = Math.atan2(ls.y - rs.y, ls.x - rs.x);
  const spanPx = ls.distanceTo(rs);
  const scaleFactor = spanPx * widthMultiplier;

  return { position, rotationZ, scaleFactor, spanPx };
}

export function lowerBodyTransform(
  torso: TorsoPoints,
  W: number,
  H: number,
  widthMultiplier: number,
): GarmentTransform {
  const lh = lmToWorld(torso.lHip, W, H);
  const rh = lmToWorld(torso.rHip, W, H);

  const position = new THREE.Vector3()
    .addVectors(lh, rh)
    .multiplyScalar(0.5);

  const rotationZ = Math.atan2(lh.y - rh.y, lh.x - rh.x);
  const spanPx = lh.distanceTo(rh);
  const scaleFactor = spanPx * widthMultiplier;

  return { position, rotationZ, scaleFactor, spanPx };
}
