"use client";

import { useEffect, useRef } from "react";

const DELTA_THRESHOLD = 0.08;  // 8% of frame width
const TIME_WINDOW_MS = 600;    // movement must complete within 600ms
const COOLDOWN_MS = 800;       // minimum ms between swipe triggers
const EMA_ALPHA = 0.4;         // smoothing factor (0=max smooth, 1=no smooth)

/* eslint-disable @typescript-eslint/no-explicit-any */

export function useHandGesture(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  onSwipe: (direction: "left" | "right") => void,
  onStatus?: (status: string) => void
): void {
  const onSwipeRef = useRef(onSwipe);
  useEffect(() => { onSwipeRef.current = onSwipe; }, [onSwipe]);

  const onStatusRef = useRef(onStatus);
  useEffect(() => { onStatusRef.current = onStatus; }, [onStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let rafId = 0;
    let hands: any = null;
    let startX: number | null = null;
    let startTime = 0;
    let smoothX: number | null = null;
    let cooldownUntil = 0;
    let processing = false;

    function report(msg: string) {
      onStatusRef.current?.(msg);
    }

    function processFrame() {
      const video = videoRef.current;
      if (video && video.readyState >= 2 && hands && !processing) {
        processing = true;
        hands.send({ image: video }).catch((e: unknown) => {
          processing = false;
          report(`send error: ${e}`);
        });
      }
      rafId = requestAnimationFrame(processFrame);
    }

    function init() {
      const HandsClass = (window as any).Hands;
      if (!HandsClass) return;

      hands = new HandsClass({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
        selfieMode: true,
      });

      hands.onResults((results: any) => {
        processing = false;

        if (!results.multiHandLandmarks?.length) {
          if (startX !== null) report("No hand — show your hand");
          startX = null;
          smoothX = null;
          return;
        }

        const rawX = results.multiHandLandmarks[0][0].x;
        const now = Date.now();

        if (now < cooldownUntil) return;

        // Smooth the x position with EMA
        smoothX = smoothX === null ? rawX : EMA_ALPHA * rawX + (1 - EMA_ALPHA) * smoothX;

        if (startX === null) {
          startX = smoothX;
          startTime = now;
          report("Hand detected — swipe left or right!");
          return;
        }

        const elapsed = now - startTime;

        // Time window expired — reset start position
        if (elapsed > TIME_WINDOW_MS) {
          startX = smoothX;
          startTime = now;
          return;
        }

        // Front camera with selfieMode: x increases = user moved left, decreases = user moved right
        // So invert: delta > 0 → user went left → scroll left; delta < 0 → user went right → scroll right
        const delta = smoothX! - startX;

        if (Math.abs(delta) > DELTA_THRESHOLD) {
          const direction: "left" | "right" = delta > 0 ? "left" : "right";
          onSwipeRef.current(direction);
          cooldownUntil = now + COOLDOWN_MS;
          startX = null;
          smoothX = null;
          report(`Swiped ${direction}!`);
        }
      });

      rafId = requestAnimationFrame(processFrame);
      report("Running — show your hand");
    }

    if ((window as any).Hands) {
      init();
    } else {
      report("Waiting for MediaPipe…");
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
