/**
 * Validates the built registry under apps/web/public/r/ against the shadcn registry schema.
 *
 * This is a structural check written by hand rather than a JSON Schema run, because pulling in
 * a validator would mean a new dependency. It covers the fields the shadcn CLI actually reads,
 * plus two checks a schema cannot make:
 *   - every registryDependencies URL points at an item this build emitted, and
 *   - no emitted file still contains a relative import, which would mean the alias rewrite in
 *     scripts/registry/rewrite-imports.mjs silently missed one.
 */
import { readdir, readFile } from "node:fs/promises";

const REGISTRY_DIR = new URL("../apps/web/public/r/", import.meta.url);

const ITEM_TYPES = new Set([
  "registry:lib",
  "registry:block",
  "registry:component",
  "registry:ui",
  "registry:hook",
  "registry:theme",
  "registry:page",
  "registry:file",
  "registry:style",
  "registry:base",
  "registry:font",
  "registry:item",
]);

/** @type {string[]} */
const errors = [];

/** @param {string} file @param {string} message */
const fail = (file, message) => errors.push(`${file}: ${message}`);

/** @param {unknown} value */
const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

/** @param {unknown} value */
const isNonEmptyString = (value) => typeof value === "string" && value.length > 0;

/** @param {unknown} value */
const isStringArray = (value) => Array.isArray(value) && value.every(isNonEmptyString);

/**
 * @param {string} file
 * @param {Record<string, unknown>} item
 * @param {{ requireContent: boolean }} options
 */
function validateItem(file, item, { requireContent }) {
  if (!isNonEmptyString(item.name)) fail(file, 'missing "name"');
  if (!isNonEmptyString(item.type) || !ITEM_TYPES.has(/** @type {string} */ (item.type))) {
    fail(file, `invalid "type": ${String(item.type)}`);
  }
  if (!isNonEmptyString(item.title)) fail(file, 'missing "title"');
  if (!isNonEmptyString(item.description)) fail(file, 'missing "description"');
  for (const key of ["dependencies", "registryDependencies", "categories"]) {
    if (!isStringArray(item[key])) fail(file, `"${key}" must be an array of strings`);
  }
  if (item.cssVars !== undefined) {
    if (!isObject(item.cssVars)) fail(file, '"cssVars" must be an object');
    else {
      for (const [scope, vars] of Object.entries(item.cssVars)) {
        if (!["theme", "light", "dark"].includes(scope))
          fail(file, `unknown cssVars scope "${scope}"`);
        if (!isObject(vars) || !Object.values(vars).every(isNonEmptyString)) {
          fail(file, `cssVars.${scope} must map names to string values`);
        }
      }
    }
  }
  if (!Array.isArray(item.files) || item.files.length === 0) {
    fail(file, 'missing "files" array');
    return;
  }
  for (const [index, entry] of item.files.entries()) {
    const at = `files[${index}]`;
    if (!isObject(entry)) {
      fail(file, `${at} is not an object`);
      continue;
    }
    if (!isNonEmptyString(entry.path)) fail(file, `${at} missing "path"`);
    if (!isNonEmptyString(entry.target)) fail(file, `${at} missing "target"`);
    if (!isNonEmptyString(entry.type) || !ITEM_TYPES.has(/** @type {string} */ (entry.type))) {
      fail(file, `${at} invalid "type": ${String(entry.type)}`);
    }
    if (!requireContent) continue;
    if (!isNonEmptyString(entry.content)) {
      fail(file, `${at} missing "content"`);
      continue;
    }
    const relative = /(?:\bfrom\s*|\bimport\s*)["'](\.[^"']*)["']/.exec(
      /** @type {string} */ (entry.content),
    );
    if (relative) {
      fail(file, `${at} still imports "${relative[1]}"; the alias rewrite missed it`);
    }
  }
}

/** @type {string[]} */
let files = [];
try {
  files = (await readdir(REGISTRY_DIR)).filter((name) => name.endsWith(".json"));
} catch {
  console.error("validate-registry: apps/web/public/r is missing. Run `pnpm build:registry`.");
  process.exit(1);
}

if (!files.includes("registry.json")) {
  console.error("validate-registry: registry.json is missing. Run `pnpm build:registry`.");
  process.exit(1);
}

/** @type {Map<string, Record<string, unknown>>} */
const items = new Map();
/** @type {Record<string, unknown> | null} */
let index = null;

for (const file of files) {
  let parsed;
  try {
    parsed = JSON.parse(await readFile(new URL(file, REGISTRY_DIR), "utf8"));
  } catch (error) {
    fail(file, `invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    continue;
  }
  if (!isObject(parsed)) {
    fail(file, "not a JSON object");
    continue;
  }
  if (file === "registry.json") index = parsed;
  else items.set(file.replace(/\.json$/, ""), parsed);
}

if (index) {
  if (index.$schema !== "https://ui.shadcn.com/schema/registry.json") {
    fail("registry.json", 'missing the "$schema" for a shadcn registry');
  }
  if (!isNonEmptyString(index.name)) fail("registry.json", 'missing "name"');
  if (!isNonEmptyString(index.homepage)) fail("registry.json", 'missing "homepage"');
  if (!Array.isArray(index.items) || index.items.length === 0) {
    fail("registry.json", 'missing "items" array');
  } else {
    const listed = new Set();
    for (const entry of index.items) {
      if (!isObject(entry)) {
        fail("registry.json", "items[] contains a non-object");
        continue;
      }
      validateItem("registry.json", entry, { requireContent: false });
      if (isNonEmptyString(entry.name)) {
        listed.add(entry.name);
        if (!items.has(/** @type {string} */ (entry.name))) {
          fail("registry.json", `lists "${entry.name}" but ${entry.name}.json was not emitted`);
        }
      }
    }
    for (const name of items.keys()) {
      if (!listed.has(name))
        fail("registry.json", `does not list "${name}", but ${name}.json exists`);
    }
  }
}

for (const [name, item] of items) {
  const file = `${name}.json`;
  if (item.$schema !== "https://ui.shadcn.com/schema/registry-item.json") {
    fail(file, 'missing the "$schema" for a shadcn registry item');
  }
  if (item.name !== name) fail(file, `"name" is "${String(item.name)}" but the file is ${file}`);
  validateItem(file, item, { requireContent: true });
  if (!isObject(item.meta)) fail(file, 'missing "meta"');
  if (isStringArray(item.registryDependencies)) {
    for (const dependency of /** @type {string[]} */ (item.registryDependencies)) {
      let target;
      try {
        target = new URL(dependency);
      } catch {
        fail(file, `registryDependencies entry "${dependency}" is not an absolute URL`);
        continue;
      }
      const referenced = target.pathname.replace(/^.*\//, "").replace(/\.json$/, "");
      if (!items.has(referenced)) {
        fail(file, `depends on "${referenced}", which this registry does not contain`);
      }
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`validate-registry: ${error}`);
  console.error(`validate-registry: ${errors.length} problem(s) found`);
  process.exit(1);
}

console.log(`validate-registry: ${items.size} items + registry.json are valid`);
