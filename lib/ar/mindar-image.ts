export type MindARImageSession = {
  start: () => Promise<void>;
  stop: () => void;
};

/**
 * Placeholder wrapper.
 *
 * We’ll implement this after Next.js deps are installed and we can import MindAR.
 * Keeping it isolated makes it easy to swap configs and handle cleanup.
 */
export function createMindARImageSession(_args: {
  container: HTMLElement;
  targetSrc: string;
}): MindARImageSession {
  return {
    async start() {
      throw new Error(
        "MindAR image session not implemented yet. Install deps + wire MindAR here.",
      );
    },
    stop() {},
  };
}

