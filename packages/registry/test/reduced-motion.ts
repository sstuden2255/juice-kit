import { vi } from "vitest";

/**
 * jsdom has no matchMedia. This mock backs `(prefers-reduced-motion: reduce)` with a flag tests
 * flip via `setReducedMotion`, and fires "change" listeners so hooks re-render.
 */
type Listener = (event: { matches: boolean; media: string }) => void;

let reduced = false;
const listeners = new Set<Listener>();

export function setReducedMotion(value: boolean): void {
  if (reduced === value) return;
  reduced = value;
  for (const listener of listeners) {
    listener({ matches: value, media: "(prefers-reduced-motion: reduce)" });
  }
}

export function installMatchMediaMock(): void {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn((query: string) => {
      const isReducedMotionQuery = query.includes("prefers-reduced-motion");
      const mql = {
        media: query,
        get matches() {
          return isReducedMotionQuery ? reduced : false;
        },
        onchange: null,
        addEventListener: (_type: string, listener: Listener) => {
          if (isReducedMotionQuery) listeners.add(listener);
        },
        removeEventListener: (_type: string, listener: Listener) => {
          listeners.delete(listener);
        },
        addListener: (listener: Listener) => {
          if (isReducedMotionQuery) listeners.add(listener);
        },
        removeListener: (listener: Listener) => {
          listeners.delete(listener);
        },
        dispatchEvent: () => true,
      };
      return mql;
    }),
  });
}
