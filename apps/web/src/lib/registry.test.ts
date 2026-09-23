import { describe, expect, it } from "vitest";
import {
  getRegistry,
  getRegistryByCategory,
  getRegistryItem,
  getRegistryItemNames,
} from "./registry";

/**
 * These assert the contract between `pnpm build:registry` and the docs pages. They need the
 * registry to have been built, which dev, typecheck, build and CI all do first.
 */
describe("registry", () => {
  it("indexes every item that was emitted", () => {
    const names = getRegistryItemNames();
    expect(names).toContain("xp-bar");
    expect(names).toContain("juice-utils");
    expect(getRegistry().items).toHaveLength(names.length);
  });

  it("groups items into the categories the sidebar renders", () => {
    const categories = getRegistryByCategory().map((group) => group.category);
    expect(categories).toEqual(expect.arrayContaining(["primitives", "components"]));
  });

  it("ships source with aliases instead of workspace-relative imports", () => {
    for (const name of getRegistryItemNames()) {
      for (const file of getRegistryItem(name).files) {
        expect(file.content, `${name} has content`).not.toBe("");
        expect(file.content, `${name} imports nothing relatively`).not.toMatch(
          /(?:from|import)\s*["']\.\.?\//,
        );
      }
    }
  });

  it("points every registry dependency at another item in this registry", () => {
    const names = new Set(getRegistryItemNames());
    for (const name of names) {
      for (const url of getRegistryItem(name).registryDependencies) {
        const referenced = url.replace(/^.*\//, "").replace(/\.json$/, "");
        expect(names, `${name} depends on ${referenced}`).toContain(referenced);
      }
    }
  });

  it("extracts a props table for each flagship component", () => {
    for (const name of ["xp-bar", "achievement-unlock", "level-up"]) {
      const item = getRegistryItem(name);
      const props = item.meta.api.interfaces.find(
        (entry) => entry.name === `${item.meta.symbol}Props`,
      );
      expect(props, `${name} exports ${item.meta.symbol}Props`).toBeDefined();
      expect(props?.members.length).toBeGreaterThan(0);
      expect(props?.members.every((member) => member.type.length > 0)).toBe(true);
    }
  });

  it("describes where each item installs and how to add it", () => {
    const item = getRegistryItem("level-up");
    expect(item.meta.target).toBe("components/ui/level-up.tsx");
    expect(item.meta.alias).toBe("@/components/ui/level-up");
    expect(item.meta.install).toMatch(/^npx shadcn@latest add https?:\/\/.+\/r\/level-up\.json$/);
  });
});
