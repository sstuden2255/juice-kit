import type { CSSProperties } from "react";

export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "juicekit-theme";

/**
 * Inlined in the document head so the theme class is set before first paint.
 *
 * "system" is resolved to a concrete class rather than left to the media query: globals.css
 * themes by class, and so does Tailwind's `dark:` variant, so leaving both classes off would
 * pair dark tokens with light-mode utilities.
 *
 * Lives outside the toggle component because a server layout cannot read a string export
 * across a "use client" boundary.
 */
export const THEME_SCRIPT = `(function(){try{
var stored=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||"system";
var dark=stored==="dark"||(stored!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);
var list=document.documentElement.classList;
list.toggle("dark",dark);list.toggle("light",!dark);
}catch(e){}})();`;

/**
 * Token overrides for a dark surface inside an otherwise light page (the landing hero, the
 * preview stages for celebration sequences). Redefining the variables on the container retints
 * the whole subtree, so components and controls inside stay legible without knowing about it.
 */
export const DARK_SURFACE = {
  "--background": "oklch(0.17 0.02 275)",
  "--foreground": "oklch(0.98 0 0)",
  "--muted": "oklch(0.27 0.02 275)",
  "--muted-foreground": "oklch(0.74 0.02 275)",
  "--accent": "oklch(0.3 0.02 275)",
  "--accent-foreground": "oklch(0.98 0 0)",
  "--primary": "oklch(0.98 0 0)",
  "--primary-foreground": "oklch(0.2 0.02 275)",
  "--border": "oklch(1 0 0 / 14%)",
} as CSSProperties;
