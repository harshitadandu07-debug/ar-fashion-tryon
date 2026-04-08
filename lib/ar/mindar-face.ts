export type MindARFaceSession = {
  start: () => Promise<void>;
  stop: () => void;
};

/**
 * Placeholder wrapper.
 *
 * We’ll implement this after Next.js deps are installed and we can import MindAR.
 */
export function createMindARFaceSession(_args: {
  container: HTMLElement;
}): MindARFaceSession {
  return {
    async start() {
      throw new Error(
        "MindAR face session not implemented yet. Install deps + wire MindAR here.",
      );
    },
    stop() {},
  };
}

