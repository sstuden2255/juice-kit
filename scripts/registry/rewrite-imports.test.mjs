import { describe, expect, it } from "vitest";
import { packageNameOf, rewriteImports } from "./rewrite-imports.mjs";

const bySource = new Map([
  ["lib/utils.ts", { name: "juice-utils", alias: "@/lib/juice-utils" }],
  ["lib/springs.ts", { name: "juice-springs", alias: "@/lib/juice-springs" }],
  [
    "hooks/use-reduced-motion.ts",
    {
      name: "use-reduced-motion-preference",
      alias: "@/hooks/use-reduced-motion-preference",
    },
  ],
  ["ui/particle-canvas.tsx", { name: "particle-canvas", alias: "@/components/ui/particle-canvas" }],
]);

/** @param {string} contents */
const rewrite = (contents, source = "ui/level-up.tsx") =>
  rewriteImports({ source, contents, bySource });

describe("rewriteImports", () => {
  it("rewrites parent- and sibling-relative imports to their aliases", () => {
    const { code } = rewrite(
      [
        'import { cn } from "../lib/utils";',
        'import { springs } from "../lib/springs";',
        'import { ParticleCanvas } from "./particle-canvas";',
      ].join("\n"),
    );
    expect(code).toBe(
      [
        'import { cn } from "@/lib/juice-utils";',
        'import { springs } from "@/lib/juice-springs";',
        'import { ParticleCanvas } from "@/components/ui/particle-canvas";',
      ].join("\n"),
    );
  });

  it("rewrites type-only imports and re-exports", () => {
    const { code } = rewrite(
      [
        'import type { ParticleCanvasHandle } from "./particle-canvas";',
        'export { cn } from "../lib/utils";',
      ].join("\n"),
    );
    expect(code).toContain(
      'import type { ParticleCanvasHandle } from "@/components/ui/particle-canvas";',
    );
    expect(code).toContain('export { cn } from "@/lib/juice-utils";');
  });

  it("reports each referenced item once, sorted", () => {
    const { registryDependencies } = rewrite(
      [
        'import { ParticleCanvas } from "./particle-canvas";',
        'import type { ParticleCanvasHandle } from "./particle-canvas";',
        'import { cn } from "../lib/utils";',
      ].join("\n"),
    );
    expect(registryDependencies).toEqual(["juice-utils", "particle-canvas"]);
  });

  it("collects npm dependencies but assumes react is already installed", () => {
    const { code, dependencies } = rewrite(
      [
        'import { useAnimate } from "motion/react";',
        'import { useRef } from "react";',
        'import type { ReactNode } from "react-dom";',
      ].join("\n"),
    );
    expect(dependencies).toEqual(["motion"]);
    // Bare specifiers are left exactly as written.
    expect(code).toContain('from "motion/react"');
  });

  it("resolves a hook that installs under a different filename", () => {
    const { code } = rewrite(
      'import { useReducedMotionPreference } from "../hooks/use-reduced-motion";',
    );
    expect(code).toBe(
      'import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";',
    );
  });

  it("throws when a relative import is not a registry item", () => {
    expect(() => rewrite('import { nope } from "../lib/nope";')).toThrow(/not a registry item/);
  });

  it("leaves code that has no imports untouched", () => {
    const contents = 'export const answer = "./not-an-import";\n';
    expect(rewrite(contents).code).toBe(contents);
  });
});

describe("packageNameOf", () => {
  it("takes the first segment of an unscoped specifier", () => {
    expect(packageNameOf("motion/react")).toBe("motion");
  });

  it("keeps both segments of a scoped specifier", () => {
    expect(packageNameOf("@scope/pkg/sub")).toBe("@scope/pkg");
  });
});
