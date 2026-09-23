/**
 * Rewrites the registry sources' relative imports into the `@/` aliases shadcn installs under.
 *
 * Inside packages/registry a component reaches its neighbours with "../lib/springs", which is
 * correct for the workspace but meaningless once the file lands in someone else's repo. The
 * manifest knows where each item installs, so every relative specifier is resolved back to an
 * item and reprinted as that item's alias. An unresolvable specifier throws: a registry that
 * emits a broken import is worse than a build that fails.
 */
import path from "node:path";

/** Packages the consumer already has; never listed as an item dependency. */
const ASSUMED_PRESENT = new Set(["react", "react-dom"]);

/** Matches the specifier of any static import/export, including bare side-effect imports. */
const SPECIFIER = /(\bfrom\s*|\bimport\s*)(["'])([^"']+)\2/g;

/**
 * @param {string} specifier a bare specifier such as "motion/react"
 * @returns {string} its npm package name ("motion", "@scope/pkg")
 */
export function packageNameOf(specifier) {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : (parts[0] ?? specifier);
}

/**
 * @param {string} source    the importing file's path under packages/registry/src
 * @param {string} specifier a relative specifier from that file
 * @param {Map<string, { alias: string, name: string }>} bySource
 * @returns {{ alias: string, name: string }}
 */
function resolveRelative(source, specifier, bySource) {
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(source), specifier));
  for (const candidate of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
    const item = bySource.get(candidate);
    if (item) return item;
  }
  throw new Error(
    `${source}: relative import "${specifier}" resolves to "${base}", which is not a registry item. ` +
      `Add it to scripts/registry/items.mjs or inline the code.`,
  );
}

/**
 * @param {object} options
 * @param {string} options.source   path under packages/registry/src
 * @param {string} options.contents file contents
 * @param {Map<string, { alias: string, name: string }>} options.bySource manifest keyed by source path
 * @returns {{ code: string, registryDependencies: string[], dependencies: string[] }}
 */
export function rewriteImports({ source, contents, bySource }) {
  /** @type {Set<string>} */ const registryDependencies = new Set();
  /** @type {Set<string>} */ const dependencies = new Set();

  const code = contents.replace(SPECIFIER, (match, keyword, quote, specifier) => {
    if (!specifier.startsWith(".")) {
      const pkg = packageNameOf(specifier);
      if (!ASSUMED_PRESENT.has(pkg)) dependencies.add(pkg);
      return match;
    }
    const item = resolveRelative(source, specifier, bySource);
    registryDependencies.add(item.name);
    return `${keyword}${quote}${item.alias}${quote}`;
  });

  return {
    code,
    registryDependencies: [...registryDependencies].sort(),
    dependencies: [...dependencies].sort(),
  };
}
