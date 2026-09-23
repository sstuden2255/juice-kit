/**
 * Which registry items have a live preview.
 *
 * Kept apart from index.tsx because that module is a client boundary: a server component can
 * import this list to decide whether to render the preview section, but cannot call into the
 * client module to ask.
 */
const WITH_PREVIEW = new Set([
  "juice-springs",
  "particle-engine",
  "particle-canvas",
  "animated-number",
  "shine-sweep",
  "xp-bar",
  "achievement-unlock",
  "level-up",
]);

export function hasPreview(name: string): boolean {
  return WITH_PREVIEW.has(name);
}
