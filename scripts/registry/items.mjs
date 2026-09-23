/**
 * The JuiceKit registry manifest: one entry per installable shadcn item.
 *
 * `source` is the file under packages/registry/src that holds the implementation. `target` is
 * where `shadcn add` writes it in the consumer's project, and `alias` is the import specifier
 * the build rewrites relative imports to. Keeping all three here means the build never has to
 * guess, and an item that moves fails loudly instead of emitting a broken import.
 *
 * Naming: UI items keep their plain names because "xp-bar" or "particle-canvas" will not
 * collide with anything. The two generically-named primitives ship as `juice-utils` and
 * `juice-springs` so installing JuiceKit can never overwrite a shadcn consumer's own
 * `lib/utils.ts`, which exports a different `cn`.
 */

export const REGISTRY_NAME = "juicekit";
export const REGISTRY_HOMEPAGE = "https://github.com/sstuden2255/juice-kit";

/** Rarity tokens are shared by the achievement badge and its particles. */
const RARITY_VARS = {
  "juice-rarity-common": "oklch(0.62 0.02 260)",
  "juice-rarity-rare": "oklch(0.62 0.17 250)",
  "juice-rarity-epic": "oklch(0.6 0.22 300)",
  "juice-rarity-legendary": "oklch(0.78 0.17 80)",
};

/**
 * @typedef {object} RegistryItem
 * @property {string} name          Registry item name; also the JSON filename.
 * @property {string} type          shadcn registry item type.
 * @property {string} title         Human-readable name for docs and the shadcn CLI.
 * @property {string} description   One sentence, shown by the CLI and on the docs index.
 * @property {string} source        Path under packages/registry/src.
 * @property {string} target        Install path in the consumer's project.
 * @property {string} alias         Import specifier other items use to reach this one.
 * @property {string[]} categories  Docs grouping.
 * @property {string} [symbol]      Primary exported symbol, for docs headings.
 * @property {Record<string, Record<string, string>>} [cssVars] shadcn cssVars block.
 */

/** @type {RegistryItem[]} */
export const ITEMS = [
  {
    name: "juice-utils",
    type: "registry:lib",
    title: "cn",
    description:
      "Dependency-free class name joiner used by every JuiceKit component. Installs beside shadcn's own lib/utils.ts rather than replacing it.",
    source: "lib/utils.ts",
    target: "lib/juice-utils.ts",
    alias: "@/lib/juice-utils",
    categories: ["primitives"],
    symbol: "cn",
  },
  {
    name: "juice-springs",
    type: "registry:lib",
    title: "Spring presets",
    description:
      "The four spring configurations JuiceKit choreographs with: snappy, bouncy, gentle, and instant.",
    source: "lib/springs.ts",
    target: "lib/juice-springs.ts",
    alias: "@/lib/juice-springs",
    categories: ["primitives"],
    symbol: "springs",
  },
  {
    name: "particle-engine",
    type: "registry:lib",
    title: "ParticleEngine",
    description:
      "Pooled canvas 2D particle system with burst, fountain, and directional emit. No confetti library, no DOM nodes.",
    source: "lib/particle-engine.ts",
    target: "lib/particle-engine.ts",
    alias: "@/lib/particle-engine",
    categories: ["primitives"],
    symbol: "ParticleEngine",
  },
  {
    name: "use-reduced-motion-preference",
    type: "registry:hook",
    title: "useReducedMotionPreference",
    description:
      "Subscribes to (prefers-reduced-motion: reduce) and lets an explicit prop override it.",
    source: "hooks/use-reduced-motion.ts",
    target: "hooks/use-reduced-motion-preference.ts",
    alias: "@/hooks/use-reduced-motion-preference",
    categories: ["primitives"],
    symbol: "useReducedMotionPreference",
  },
  {
    name: "particle-canvas",
    type: "registry:ui",
    title: "ParticleCanvas",
    description:
      "Pointer-transparent canvas that fills its positioned parent and exposes burst, fountain, and emit through a ref.",
    source: "ui/particle-canvas.tsx",
    target: "components/ui/particle-canvas.tsx",
    alias: "@/components/ui/particle-canvas",
    categories: ["primitives"],
    symbol: "ParticleCanvas",
  },
  {
    name: "animated-number",
    type: "registry:ui",
    title: "AnimatedNumber",
    description:
      "Odometer-style number roll on a spring, with full Intl formatting and the target value announced to screen readers.",
    source: "ui/animated-number.tsx",
    target: "components/ui/animated-number.tsx",
    alias: "@/components/ui/animated-number",
    categories: ["primitives"],
    symbol: "AnimatedNumber",
  },
  {
    name: "shine-sweep",
    type: "registry:ui",
    title: "ShineSweep",
    description: "Masked highlight sweep over any children, driven entirely by transform.",
    source: "ui/shine-sweep.tsx",
    target: "components/ui/shine-sweep.tsx",
    alias: "@/components/ui/shine-sweep",
    categories: ["primitives"],
    symbol: "ShineSweep",
    cssVars: {
      light: { "juice-shine": "rgba(255, 255, 255, 0.7)" },
      dark: { "juice-shine": "rgba(255, 255, 255, 0.45)" },
    },
  },
  {
    name: "xp-bar",
    type: "registry:ui",
    title: "XPBar",
    description:
      "Progress bar with spring fill, a gain flash, a counting label, and a level-boundary rollover event.",
    source: "ui/xp-bar.tsx",
    target: "components/ui/xp-bar.tsx",
    alias: "@/components/ui/xp-bar",
    categories: ["components"],
    symbol: "XPBar",
  },
  {
    name: "achievement-unlock",
    type: "registry:ui",
    title: "AchievementUnlock",
    description:
      "Badge drop, shine sweep, rarity-coloured particle burst, then a staggered title and description reveal.",
    source: "ui/achievement-unlock.tsx",
    target: "components/ui/achievement-unlock.tsx",
    alias: "@/components/ui/achievement-unlock",
    categories: ["components"],
    symbol: "AchievementUnlock",
    cssVars: { light: { ...RARITY_VARS }, dark: { ...RARITY_VARS } },
  },
  {
    name: "level-up",
    type: "registry:ui",
    title: "LevelUp",
    description:
      "Radial glow burst, the old level flipping away as the new one springs in, particles, and an optional screen flash.",
    source: "ui/level-up.tsx",
    target: "components/ui/level-up.tsx",
    alias: "@/components/ui/level-up",
    categories: ["components"],
    symbol: "LevelUp",
    cssVars: {
      light: { "juice-glow": "oklch(0.72 0.19 45)" },
      dark: { "juice-glow": "oklch(0.78 0.17 80)" },
    },
  },
];

/** @type {Map<string, RegistryItem>} keyed by `source`, for resolving relative imports. */
export const ITEMS_BY_SOURCE = new Map(ITEMS.map((item) => [item.source, item]));

/** @type {Map<string, RegistryItem>} */
export const ITEMS_BY_NAME = new Map(ITEMS.map((item) => [item.name, item]));
