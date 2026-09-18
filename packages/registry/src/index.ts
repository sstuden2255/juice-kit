/**
 * JuiceKit registry source.
 *
 * Animation primitives and components are added under `src/` in Phase 2 and published as
 * shadcn-compatible registry items in Phase 3. This module exists so the package has a
 * type-checked, tested entry point from day one.
 */
export const registry = {
  name: "juicekit",
  version: "0.0.0",
} as const;

export type Registry = typeof registry;
