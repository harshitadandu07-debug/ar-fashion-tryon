"use client";

import { useEffect, useRef } from "react";

const DELTA_THRESHOLD = 0.15;  // 15% of frame width
const TIME_WINDOW_MS = 400;    // movement must complete within 400ms
const COOLDOWN_MS = 800;       // minimum ms between swipe triggers

/* eslint-disable @typescript-eslint/no-explicit-any */

export function useHandGesture(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  onSwipe: (direction: "left" | "right") => void
): void {
  // Use a ref for the callback to avoid re-running the effect when it changes
  const onSwipeRef = useRef(onSwipe);
  useEffect(() => {
    onSwipeRef.current = onSwipe;
  }, [onSwipe]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let rafId = 0;
    let hands: any = null;
    let lastX: number | null = null;
    let lastTime = 0;
    let cooldownUntil = 0;

    function processFrame() {
      const video = videoRef.current;
      if (video && video.readyState >= 2 && hands) {
        hands.send({ image: video }).catch(() => {/* ignore per-frame errors */});
      }
      rafId = requestAnimationFrame(processFrame);
    }

    function init() {
      const HandsClass = (window as any).Hands;
      if (!HandsClass || !videoRef.current) return;

      hands = new HandsClass({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });

      hands.onResults((results: any) => {
        if (!results.multiHandLandmarks?.length) {
          lastX = null;
          return;
        }

        const wrist = results.multiHandLandmarks[0][0]; // landmark 0 = wrist
        const now = Date.now();

        if (lastX !== null && now > cooldownUntil) {
          const delta = wrist.x - lastX;
          const elapsed = now - lastTime;

          if (Math.abs(delta) > DELTA_THRESHOLD && elapsed < TIME_WINDOW_MS) {
            // hand moves right (x increases) → next card (scroll right)
            // hand moves left  (x decreases) → prev card (scroll left)
            const direction: "left" | "right" = delta > 0 ? "right" : "left";
            onSwipeRef.current(direction);
            cooldownUntil = now + COOLDOWN_MS;
            lastX = null;
            return;
          }
        }

        lastX = wrist.x;
        lastTime = now;
      });

      rafId = requestAnimationFrame(processFrame);
    }

    // MediaPipe may still be loading when this effect runs
    if ((window as any).Hands) {
      init();
    } else {
      const interval = setInterval(() => {
        if ((window as any).Hands) {
          clearInterval(interval);
          init();
        }
      }, 100);
      return () => {
        clearInterval(interval);
        cancelAnimationFrame(rafId);
        hands?.close();
      };
    }

    return () => {
      cancelAnimationFrame(rafId);
      hands?.close();
    };
  // videoRef is stable (created with useRef), so this effect runs once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
