import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * True when the user prefers reduced motion. Every JuiceKit component treats this as a
 * first-class state: instant state changes plus a subtle fade instead of choreography, and
 * no particles. Pass `override` (a component's `reducedMotion` prop) to force either mode.
 */
export function useReducedMotionPreference(override?: boolean): boolean {
  const system = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return override ?? system;
}
