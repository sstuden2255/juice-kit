import { act, renderHook } from "@testing-library/react";
import { expect, test } from "vitest";
import { setReducedMotion } from "../../test/reduced-motion";
import { useReducedMotionPreference } from "./use-reduced-motion";

test("tracks the prefers-reduced-motion media query", () => {
  const { result } = renderHook(() => useReducedMotionPreference());
  expect(result.current).toBe(false);
  act(() => setReducedMotion(true));
  expect(result.current).toBe(true);
  act(() => setReducedMotion(false));
  expect(result.current).toBe(false);
});

test("an explicit override wins over the system preference", () => {
  setReducedMotion(true);
  const { result } = renderHook(() => useReducedMotionPreference(false));
  expect(result.current).toBe(false);
  const forced = renderHook(() => useReducedMotionPreference(true));
  setReducedMotion(false);
  expect(forced.result.current).toBe(true);
});
