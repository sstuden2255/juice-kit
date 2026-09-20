import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { installCanvasMock } from "./canvas-mock";
import { installMatchMediaMock, setReducedMotion } from "./reduced-motion";

installMatchMediaMock();
installCanvasMock();

beforeEach(() => {
  setReducedMotion(false);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
