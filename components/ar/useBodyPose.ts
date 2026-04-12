"use client";

import { useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type TorsoBox = {
  x: number;      // left edge, 0–1 of frame width
  y: number;      // top edge,  0–1 of frame height
  width: number;  // 0–1
  height: number; // 0–1
};

// MediaPipe Pose landmark indices
const L_SHOULDER = 11;
const R_SHOULDER = 12;
const L_HIP = 23;
const R_HIP = 24;

export function useBodyPose(
  videoRef: React.RefObject<HTMLVideoElement | null>
): TorsoBox | null {
  const [torso, setTorso] = useState<TorsoBox | null>(null);
  const torsoRef = useRef<TorsoBox | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let rafId = 0;
    let pose: any = null;
    let processing = false;

    function processFrame() {
      const video = videoRef.current;
      if (video && video.readyState >= 2 && pose && !processing) {
        processing = true;
        pose.send({ image: video }).catch(() => { processing = false; });
      }
      rafId = requestAnimationFrame(processFrame);
    }

    function init() {
      const PoseClass = (window as any).Pose;
      if (!PoseClass) return;

      pose = new PoseClass({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 0,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        selfieMode: true,
      });

      pose.onResults((results: any) => {
        processing = false;
        const lm = results.poseLandmarks;
        if (!lm) { setTorso(null); torsoRef.current = null; return; }

        const ls = lm[L_SHOULDER];
        const rs = lm[R_SHOULDER];
        const lh = lm[L_HIP];
        const rh = lm[R_HIP];

        if (!ls || !rs || !lh || !rh) return;

        // Shoulder midpoint and span
        const shoulderSpan = Math.abs(ls.x - rs.x);
        const midX = (ls.x + rs.x) / 2;
        const shoulderY = Math.min(ls.y, rs.y);
        const hipY = (lh.y + rh.y) / 2;

        // Scale clothing to be ~2.5x the shoulder span wide,
        // tall enough to cover shoulder-to-hip + a bit below
        const clothingWidth = shoulderSpan * 2.5;
        const clothingHeight = (hipY - shoulderY) * 1.8;

        const box: TorsoBox = {
          x: midX - clothingWidth / 2,
          y: shoulderY - shoulderSpan * 0.3, // start slightly above shoulders
          width: clothingWidth,
          height: clothingHeight,
        };

        torsoRef.current = box;
        setTorso({ ...box });
      });

      rafId = requestAnimationFrame(processFrame);
    }

    if ((window as any).Pose) {
      init();
    } else {
      const interval = setInterval(() => {
        if ((window as any).Pose) {
          clearInterval(interval);
          init();
        }
      }, 100);
      return () => {
        clearInterval(interval);
        cancelAnimationFrame(rafId);
        pose?.close();
      };
    }

    return () => {
      cancelAnimationFrame(rafId);
      pose?.close();
    };
  // videoRef is stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return torso;
}
