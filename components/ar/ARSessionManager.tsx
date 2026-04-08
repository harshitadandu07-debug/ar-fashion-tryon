import type { Look } from "@/types/look";

export type ExperienceStage =
  | "landing"
  | "detecting"
  | "browsing"
  | "tryon"
  | "result";

export type EntryMode = "poster" | "qr";

export type ARSessionState = {
  entryMode: EntryMode;
  cameraPermission: "idle" | "prompting" | "granted" | "denied";
  posterDetected: boolean;
  selectedLook: Look | null;
  experienceStage: ExperienceStage;
};

type ARSessionManagerProps = {
  state: ARSessionState;
  onPosterDetected: () => void;
  onSelectLook: (look: Look) => void;
  onEnterTryOn: () => void;
  onExitTryOn: () => void;
};

/**
 * This component is intentionally “headless”.
 * It defines the state + transitions; rendering is handled by route components.
 */
export function ARSessionManager(_props: ARSessionManagerProps) {
  return null;
}

