import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Reads the registry that `pnpm build:registry` wrote into public/r.
 *
 * Docs pages show exactly what `shadcn add` installs — the same rewritten source, the same
 * dependency list — so they read the built artifact rather than the workspace source. Every
 * docs page is statically rendered, so these files are read at build time and never at runtime.
 *
 * Server-only: importing this from a client component would try to bundle node:fs.
 */

/** One declared member of an exported interface. */
export interface RegistryMember {
  name: string;
  optional: boolean;
  type: string;
  description: string;
  defaultValue: string | null;
}

export interface RegistryInterface {
  name: string;
  /** The heritage clause, e.g. `ComponentPropsWithoutRef<"div">`, or null. */
  extends: string | null;
  members: RegistryMember[];
}

export interface RegistryTypeAlias {
  name: string;
  text: string;
}

export interface RegistryItemMeta {
  symbol: string;
  alias: string;
  target: string;
  source: string;
  install: string;
  api: { interfaces: RegistryInterface[]; types: RegistryTypeAlias[] };
}

export interface RegistryFile {
  path: string;
  type: string;
  target: string;
  content: string;
}

export interface RegistryItem {
  name: string;
  type: string;
  title: string;
  description: string;
  author: string;
  categories: string[];
  dependencies: string[];
  registryDependencies: string[];
  files: RegistryFile[];
  docs: string;
  cssVars?: Record<string, Record<string, string>>;
  meta: RegistryItemMeta;
}

/** Index entries carry the same metadata minus file contents and the extracted API. */
export type RegistryIndexItem = Omit<RegistryItem, "files" | "meta"> & {
  files: Omit<RegistryFile, "content">[];
  meta: Omit<RegistryItemMeta, "api">;
};

export interface RegistryIndex {
  name: string;
  homepage: string;
  items: RegistryIndexItem[];
}

/**
 * Next runs with apps/web as the working directory, Vitest with the workspace root, so the
 * registry is looked up in both places rather than assuming one. An explicit path wins.
 */
const CANDIDATE_DIRS = [
  process.env.JUICEKIT_REGISTRY_DIR,
  path.join(process.cwd(), "public", "r"),
  path.join(process.cwd(), "apps", "web", "public", "r"),
].filter((dir): dir is string => dir !== undefined);

let resolvedDir: string | undefined;

function registryDir(): string {
  if (resolvedDir !== undefined) return resolvedDir;
  const found = CANDIDATE_DIRS.find((dir) => existsSync(path.join(dir, "registry.json")));
  if (found === undefined) {
    throw new Error(
      `No built registry found (looked in ${CANDIDATE_DIRS.join(", ")}). ` +
        "Run `pnpm build:registry` first.",
    );
  }
  resolvedDir = found;
  return found;
}

/** @throws when the registry has not been built yet. */
function readRegistryFile<T>(file: string): T {
  const target = path.join(registryDir(), file);
  try {
    return JSON.parse(readFileSync(target, "utf8")) as T;
  } catch (cause) {
    throw new Error(`Could not read ${target}. Run \`pnpm build:registry\` first.`, { cause });
  }
}

export function getRegistry(): RegistryIndex {
  return readRegistryFile<RegistryIndex>("registry.json");
}

export function getRegistryItem(name: string): RegistryItem {
  return readRegistryFile<RegistryItem>(`${name}.json`);
}

/** Registry item names, in manifest order. */
export function getRegistryItemNames(): string[] {
  return getRegistry().items.map((item) => item.name);
}

/** Groups the index the way the docs sidebar lists it. */
export function getRegistryByCategory(): { category: string; items: RegistryIndexItem[] }[] {
  const groups = new Map<string, RegistryIndexItem[]>();
  for (const item of getRegistry().items) {
    for (const category of item.categories) {
      const bucket = groups.get(category);
      if (bucket) bucket.push(item);
      else groups.set(category, [item]);
    }
  }
  return [...groups].map(([category, items]) => ({ category, items }));
}

/** The base URL the registry was built with, taken from an item's own install command. */
export function getRegistryBaseUrl(): string {
  const [first] = getRegistry().items;
  if (!first) return "";
  return new URL(first.meta.install.split(" ").at(-1) ?? "").origin;
}
