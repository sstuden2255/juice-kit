import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// Testing Library only auto-registers cleanup when Vitest globals are on; do it explicitly.
afterEach(() => {
  cleanup();
});

// jsdom has no matchMedia. Motion reads it for prefers-reduced-motion, so Phase 2 tests can
// flip `matches` per test via vi.mocked(window.matchMedia).mockImplementation(...). Vitest 5
// defaults to clearMocks: true / mockReset: false, which clears calls but keeps a custom
// implementation, so reinstall the default below before each test: without that, one
// reduced-motion override would leak into every later test in the file.
const matchMediaImpl = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn(matchMediaImpl),
  });

  beforeEach(() => {
    vi.mocked(window.matchMedia).mockImplementation(matchMediaImpl);
  });
}

// jsdom has no canvas implementation and logs "Not implemented" for every getContext() call.
// ParticleEngine already copes with a null context; this keeps the noise out of the run.
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null);
}
