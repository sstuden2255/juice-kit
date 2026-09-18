import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Testing Library only auto-registers cleanup when Vitest globals are on; do it explicitly.
afterEach(() => {
  cleanup();
});

// jsdom has no matchMedia. Motion reads it for prefers-reduced-motion, so Phase 2 tests can
// flip `matches` per test via vi.mocked(window.matchMedia).mockImplementation(...).
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
