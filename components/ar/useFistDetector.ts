"use client";

import { useEffect, useRef } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

const HOLD_MS    = 2000; // fist must be held ~2s to confirm
const OPEN_THRESHOLD = 3; // at least 3 fingers open before we start watching for fist

/** Count how many fingers are extended (tip above MCP in screen space) */
function extendedFingers(landmarks: any[]): number {
  const tips = [8, 12, 16, 20];
  const mcps = [5,  9, 13, 17];
  return tips.filter((t, i) => landmarks[t].y < landmarks[mcps[i]].y).length;
}

/** All four fingers are curled */
function isFist(landmarks: any[]): boolean {
  return extendedFingers(landmarks) === 0;
}

/**
 * Detects a closed fist held for HOLD_MS milliseconds using MediaPipe Hands.
 * Fires onFistLocked once per closed-fist event; resets when hand opens.
 * Expects the Hands CDN script to be loaded before this hook runs.
 */
export function useFistDetector(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  onFistLocked: () => void,
  enabled: boolean,
) {
  const onFistRef = useRef(onFistLocked);
  useEffect(() => { onFistRef.current = onFistLocked; }, [onFistLocked]);

  const enabledRef = useRef(enabled);
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let rafId      = 0;
    let hands: any = null;
    let processing = false;
    let fistStart: number | null = null;
    let fired      = false;
    let handWasOpen = false; // must see open hand before watching for fist

    function processFrame() {
      const video = videoRef.current;
      if (video && video.readyState >= 2 && hands && !processing && enabledRef.current) {
        processing = true;
        hands.send({ image: video }).catch(() => { processing = false; });
      }
      rafId = requestAnimationFrame(processFrame);
    }

    function init() {
      const HandsClass = (window as any).Hands;
      if (!HandsClass) return;

      hands = new HandsClass({
        locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
      });
      hands.setOptions({
        maxNumHands:             1,
        modelComplexity:         0,
        minDetectionConfidence:  0.72,
        minTrackingConfidence:   0.5,
        selfieMode:              true,
      });

      hands.onResults((results: any) => {
        processing = false;
        if (!enabledRef.current) return;

        const now = Date.now();

        if (!results.multiHandLandmarks?.length) {
          fistStart = null;
          fired     = false;
          return;
        }

        const lm = results.multiHandLandmarks[0];

        // Require hand to be clearly open first so natural hand position
        // doesn't accidentally trigger
        if (extendedFingers(lm) >= OPEN_THRESHOLD) {
          handWasOpen = true;
        }

        if (handWasOpen && isFist(lm)) {
          if (fistStart === null) fistStart = now;
          else if (!fired && now - fistStart >= HOLD_MS) {
            fired      = true;
            handWasOpen = false; // reset — need open hand again before next fist
            onFistRef.current();
          }
        } else if (!isFist(lm)) {
          fistStart = null;
          fired     = false;
        }
      });

      rafId = requestAnimationFrame(processFrame);
    }

    // Hands CDN may load after this hook mounts — poll until available
    if ((window as any).Hands) {
      init();
    } else {
      const iv = setInterval(() => {
        if ((window as any).Hands) { clearInterval(iv); init(); }
      }, 200);
      return () => { clearInterval(iv); cancelAnimationFrame(rafId); hands?.close(); };
    }

    return () => { cancelAnimationFrame(rafId); hands?.close(); };
  // videoRef is stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
