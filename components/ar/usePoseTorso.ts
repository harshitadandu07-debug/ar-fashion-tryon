"use client";

import React, { useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type TorsoPoint = { x: number; y: number };

export type TorsoPoints = {
  lShoulder: TorsoPoint;
  rShoulder: TorsoPoint;
  lHip:      TorsoPoint;
  rHip:      TorsoPoint;
  neck:      TorsoPoint; // estimated: mid-shoulder shifted up
  lElbow:    TorsoPoint | null;
  rElbow:    TorsoPoint | null;
  lWrist:    TorsoPoint | null;
  rWrist:    TorsoPoint | null;
  lKnee:     TorsoPoint | null;
  rKnee:     TorsoPoint | null;
  lAnkle:    TorsoPoint | null;
  rAnkle:    TorsoPoint | null;
};

export type PoseTorsoResult = {
  torso:      TorsoPoints | null;
  confidence: number; // 0–1, average landmark visibility
  segMaskRef: React.RefObject<CanvasImageSource | null>;
};

// MediaPipe Pose landmark indices
const L_SHOULDER = 11;
const R_SHOULDER = 12;
const L_HIP      = 23;
const R_HIP      = 24;
const L_ELBOW    = 13;
const R_ELBOW    = 14;
const L_WRIST    = 15;
const R_WRIST    = 16;
const L_KNEE     = 25;
const R_KNEE     = 26;
const L_ANKLE    = 27;
const R_ANKLE    = 28;

const EMA_ALPHA       = 0.12; // more smoothing — reduces phone-shake false triggers
const DELTA_THRESHOLD = 0.28; // higher threshold — requires a more deliberate swipe
const TIME_WINDOW_MS  = 400;  // shorter window — must be a fast intentional gesture
const COOLDOWN_MS     = 1800; // longer cooldown — prevents rapid re-triggering

function ema(prev: TorsoPoint | null, next: { x: number; y: number }): TorsoPoint {
  if (prev === null) return { x: next.x, y: next.y };
  return {
    x: EMA_ALPHA * next.x + (1 - EMA_ALPHA) * prev.x,
    y: EMA_ALPHA * next.y + (1 - EMA_ALPHA) * prev.y,
  };
}

export function usePoseTorso(
  videoRef:  React.RefObject<HTMLVideoElement | null>,
  onSwipe?:  (direction: "left" | "right") => void,
  onStatus?: (status: string) => void,
): PoseTorsoResult {
  const [torso, setTorso]           = useState<TorsoPoints | null>(null);
  const [confidence, setConfidence] = useState(0);
  const segMaskRef  = useRef<CanvasImageSource | null>(null);
  const onSwipeRef  = useRef(onSwipe);
  const onStatusRef = useRef(onStatus);
  useEffect(() => { onSwipeRef.current  = onSwipe;  }, [onSwipe]);
  useEffect(() => { onStatusRef.current = onStatus; }, [onStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let mounted    = true;
    let rafId      = 0;
    let pose: any  = null;
    let processing = false;

    // EMA state — smoothed per-point
    let smLS: TorsoPoint | null = null;
    let smRS: TorsoPoint | null = null;
    let smLH: TorsoPoint | null = null;
    let smRH: TorsoPoint | null = null;
    let smLE: TorsoPoint | null = null;
    let smRE: TorsoPoint | null = null;
    let smLW: TorsoPoint | null = null;
    let smRW: TorsoPoint | null = null;
    let smLK: TorsoPoint | null = null;
    let smRK: TorsoPoint | null = null;
    let smLA: TorsoPoint | null = null;
    let smRA: TorsoPoint | null = null;

    // Swipe state
    let startX: number | null = null;
    let startTime             = 0;
    let smoothX: number | null = null;
    let cooldownUntil         = 0;

    // Confidence state
    let prevConf = -1;

    let lastStatus = "";
    function report(msg: string) {
      if (msg === lastStatus) return;
      lastStatus = msg;
      onStatusRef.current?.(msg);
    }

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
        modelComplexity:        1,
        smoothLandmarks:        true,
        enableSegmentation:     true,
        smoothSegmentation:     true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence:  0.5,
        selfieMode:             true,
      });

      pose.onResults((results: any) => {
        processing = false;

        if (results.segmentationMask) {
          segMaskRef.current = results.segmentationMask as CanvasImageSource;
        }

        const lm = results.poseLandmarks;
        if (!lm) {
          if (mounted) setTorso(null);
          if (mounted) setConfidence(0);
          smLS = smRS = smLH = smRH = null;
          smLE = smRE = smLW = smRW = smLK = smRK = smLA = smRA = null;
          startX = null;
          smoothX = null;
          report("No body detected — step back so upper body is visible");
          return;
        }

        const ls = lm[L_SHOULDER];
        const rs = lm[R_SHOULDER];
        const lh = lm[L_HIP];
        const rh = lm[R_HIP];

        if (!ls || !rs || !lh || !rh) {
          if (mounted) setTorso(null);
          if (mounted) setConfidence(0);
          return;
        }

        // Average visibility across the 4 key landmarks
        const conf = ((ls.visibility ?? 0) + (rs.visibility ?? 0) + (lh.visibility ?? 0) + (rh.visibility ?? 0)) / 4;
        if (Math.abs(conf - prevConf) > 0.01) {
          prevConf = conf;
          if (mounted) setConfidence(conf);
        }

        // EMA-smooth each point
        smLS = ema(smLS, ls);
        smRS = ema(smRS, rs);
        smLH = ema(smLH, lh);
        smRH = ema(smRH, rh);
        if (lm[L_ELBOW]) smLE = ema(smLE, lm[L_ELBOW]);
        if (lm[R_ELBOW]) smRE = ema(smRE, lm[R_ELBOW]);
        if (lm[L_WRIST]) smLW = ema(smLW, lm[L_WRIST]);
        if (lm[R_WRIST]) smRW = ema(smRW, lm[R_WRIST]);
        if (lm[L_KNEE])  smLK = ema(smLK, lm[L_KNEE]);
        if (lm[R_KNEE])  smRK = ema(smRK, lm[R_KNEE]);
        if (lm[L_ANKLE]) smLA = ema(smLA, lm[L_ANKLE]);
        if (lm[R_ANKLE]) smRA = ema(smRA, lm[R_ANKLE]);

        // Estimate neck: mid-shoulder shifted up by half the shoulder span
        const shoulderSpan = Math.abs(smLS.x - smRS.x);
        const neck: TorsoPoint = {
          x: (smLS.x + smRS.x) / 2,
          y: Math.min(smLS.y, smRS.y) - shoulderSpan * 0.5,
        };

        if (mounted) {
          setTorso({
            lShoulder: smLS,
            rShoulder: smRS,
            lHip:      smLH,
            rHip:      smRH,
            neck,
            lElbow: smLE, rElbow: smRE,
            lWrist: smLW, rWrist: smRW,
            lKnee:  smLK, rKnee:  smRK,
            lAnkle: smLA, rAnkle: smRA,
          });
        }

        if (conf >= 0.6) {
          report("Body detected — swipe left or right to try on");
        }

        // ── Wrist swipe ──────────────────────────────────────────
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const le = lm[L_ELBOW];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const re = lm[R_ELBOW];
        // Use right wrist for swipe detection
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
          const direction: "left" | "right" = delta > 0 ? "left" : "right";
          onSwipeRef.current?.(direction);
          cooldownUntil = now + COOLDOWN_MS;
          startX  = null;
          smoothX = null;
          report(`Swiped ${direction}!`);
        }
      });

      rafId = requestAnimationFrame(processFrame);
      report("Pose loaded — step back so your full upper body is visible");
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
        mounted = false;
        clearInterval(interval);
        cancelAnimationFrame(rafId);
        pose?.close();
      };
    }

    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
      pose?.close();
    };
  // videoRef is stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { torso, confidence, segMaskRef };
}
