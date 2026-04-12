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
const L_HIP      = 23;
const R_HIP      = 24;
const R_WRIST    = 16; // use right wrist for gesture detection

// Swipe detection constants
const DELTA_THRESHOLD = 0.18;
const TIME_WINDOW_MS  = 500;
const COOLDOWN_MS     = 1200;
const EMA_ALPHA       = 0.25;

export function useBodyPose(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  onSwipe?: (direction: "left" | "right") => void,
  onStatus?: (status: string) => void,
): TorsoBox | null {
  const [torso, setTorso] = useState<TorsoBox | null>(null);
  const onSwipeRef = useRef(onSwipe);
  const onStatusRef = useRef(onStatus);
  useEffect(() => { onSwipeRef.current = onSwipe; }, [onSwipe]);
  useEffect(() => { onStatusRef.current = onStatus; }, [onStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let rafId = 0;
    let pose: any = null;
    let processing = false;

    // Swipe state
    let startX: number | null = null;
    let startTime = 0;
    let smoothX: number | null = null;
    let cooldownUntil = 0;

    function report(msg: string) { onStatusRef.current?.(msg); }

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

        if (!lm) {
          setTorso(null);
          startX = null;
          smoothX = null;
          return;
        }

        // ── Torso overlay box ──────────────────────────────────────
        const ls = lm[L_SHOULDER];
        const rs = lm[R_SHOULDER];
        const lh = lm[L_HIP];
        const rh = lm[R_HIP];

        if (ls && rs && lh && rh) {
          const shoulderSpan = Math.abs(ls.x - rs.x);
          const midX         = (ls.x + rs.x) / 2;
          // Anchor top of garment at the neck/collar (slightly above shoulders)
          const shoulderY    = Math.min(ls.y, rs.y);
          const hipY         = (lh.y + rh.y) / 2;
          // Width: just slightly beyond shoulder joints (coat sits on shoulders)
          const clothingW    = shoulderSpan * 1.2;
          // Height: from collar down to mid-thigh (2.5x shoulder-to-hip distance)
          const clothingH    = (hipY - shoulderY) * 2.5;

          setTorso({
            x: midX - clothingW / 2,
            y: shoulderY - shoulderSpan * 0.15, // collar sits just above shoulders
            width: clothingW,
            height: clothingH,
          });
        }

        // ── Wrist swipe gesture ────────────────────────────────────
        const wrist = lm[R_WRIST];
        if (!wrist) return;

        const rawX = wrist.x;
        const now  = Date.now();

        if (now < cooldownUntil) return;

        smoothX = smoothX === null
          ? rawX
          : EMA_ALPHA * rawX + (1 - EMA_ALPHA) * smoothX;

        if (startX === null) {
          startX    = smoothX;
          startTime = now;
          report("Body detected — swipe left or right!");
          return;
        }

        const elapsed = now - startTime;
        if (elapsed > TIME_WINDOW_MS) {
          startX    = smoothX;
          startTime = now;
          return;
        }

        const delta = smoothX! - startX;
        if (Math.abs(delta) > DELTA_THRESHOLD) {
          // selfieMode: x increases = user moved left; decreases = user moved right
          const direction: "left" | "right" = delta > 0 ? "left" : "right";
          onSwipeRef.current?.(direction);
          cooldownUntil = now + COOLDOWN_MS;
          startX  = null;
          smoothX = null;
          report(`Swiped ${direction}!`);
        }
      });

      rafId = requestAnimationFrame(processFrame);
      report("Pose loaded — step back so your body is visible");
    }

    if ((window as any).Pose) {
      init();
    } else {
      report("Waiting for MediaPipe Pose…");
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
