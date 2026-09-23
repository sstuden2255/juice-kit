/**
 * Builds the shadcn-compatible registry from packages/registry/src.
 *
 * Output lands in apps/web/public/r/ so Next serves it directly:
 *   npx shadcn@latest add http://localhost:3000/r/xp-bar.json
 *
 * The directory is generated, never committed. CI rebuilds it before lint/typecheck/build so
 * the docs pages and the served JSON can never disagree with the component source.
 *
 * Usage: node scripts/build-registry.mjs [--base-url https://juicekit.dev]
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractApi } from "./registry/extract-props.mjs";
import { ITEMS, REGISTRY_HOMEPAGE, REGISTRY_NAME } from "./registry/items.mjs";
import { rewriteImports } from "./registry/rewrite-imports.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC_DIR = path.join(ROOT, "packages/registry/src");
const OUT_DIR = path.join(ROOT, "apps/web/public/r");
const REGISTRY_PKG = path.join(ROOT, "packages/registry/package.json");

const SCHEMA_REGISTRY = "https://ui.shadcn.com/schema/registry.json";
const SCHEMA_ITEM = "https://ui.shadcn.com/schema/registry-item.json";

/**
 * The docs site and the shadcn CLI both need absolute URLs for cross-item dependencies, so the
 * host has to be known at build time. Defaults to the dev server.
 *
 * @returns {string} base URL with no trailing slash
 */
function resolveBaseUrl() {
  const flagIndex = process.argv.indexOf("--base-url");
  const fromFlag = flagIndex === -1 ? undefined : process.argv[flagIndex + 1];
  const raw = fromFlag ?? process.env.REGISTRY_BASE_URL ?? "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/** @param {string} dependency @param {Record<string, string>} peers */
function withVersion(dependency, peers) {
  const range = peers[dependency];
  return range ? `${dependency}@${range}` : dependency;
}

async function main() {
  const baseUrl = resolveBaseUrl();
  const peers = JSON.parse(await readFile(REGISTRY_PKG, "utf8")).peerDependencies ?? {};
  const bySource = new Map(ITEMS.map((item) => [item.source, item]));

  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const index = [];

  for (const item of ITEMS) {
    const sourcePath = path.join(SRC_DIR, item.source);
    const contents = await readFile(sourcePath, "utf8");
    const { code, registryDependencies, dependencies } = rewriteImports({
      source: item.source,
      contents,
      bySource,
    });

    const files = [
      {
        path: `packages/registry/src/${item.source}`,
        type: item.type,
        target: item.target,
        content: code,
      },
    ];

    /** @type {Record<string, unknown>} */
    const definition = {
      $schema: SCHEMA_ITEM,
      name: item.name,
      type: item.type,
      title: item.title,
      description: item.description,
      author: "JuiceKit",
      categories: item.categories,
      dependencies: dependencies.map((dependency) => withVersion(dependency, peers)),
      registryDependencies: registryDependencies.map((name) => `${baseUrl}/r/${name}.json`),
      files,
      docs: `${baseUrl}/docs/${item.name}`,
      meta: {
        symbol: item.symbol ?? item.title,
        alias: item.alias,
        target: item.target,
        source: item.source,
        install: `npx shadcn@latest add ${baseUrl}/r/${item.name}.json`,
        api: extractApi(sourcePath, contents),
      },
    };
    if (item.cssVars) definition.cssVars = item.cssVars;

    await writeFile(
      path.join(OUT_DIR, `${item.name}.json`),
      `${JSON.stringify(definition, null, 2)}\n`,
      "utf8",
    );

    // The index is a catalogue, so it drops the two bulky parts that belong to the per-item
    // files: the source contents and the extracted API.
    const indexMeta = { ...definition.meta };
    delete indexMeta.api;
    index.push({
      ...definition,
      $schema: undefined,
      meta: indexMeta,
      files: files.map((file) => ({ path: file.path, type: file.type, target: file.target })),
    });
  }

  const registry = {
    $schema: SCHEMA_REGISTRY,
    name: REGISTRY_NAME,
    homepage: REGISTRY_HOMEPAGE,
    items: index,
  };
  await writeFile(
    path.join(OUT_DIR, "registry.json"),
    `${JSON.stringify(registry, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `build-registry: wrote ${ITEMS.length} items + registry.json to apps/web/public/r (base ${baseUrl})`,
  );
}

await main();
