// Validates shadcn-style registry items under apps/web/public/r/ (built in Phase 3).
// Exits 0 with a note when the directory does not exist yet.
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

/**
 * @param {string} file
 * @param {unknown} item
 * @returns {string | null} an error message, or null when the item is valid
 */
function validateItem(file, item) {
  if (typeof item !== "object" || item === null) return "not a JSON object";
  const record = /** @type {Record<string, unknown>} */ (item);
  if (file === "registry.json") {
    return Array.isArray(record.items) ? null : 'registry.json must have an "items" array';
  }
  if (typeof record.name !== "string" || record.name.length === 0) return 'missing "name"';
  if (typeof record.type !== "string" || !ITEM_TYPES.has(record.type)) {
    return `invalid "type": ${String(record.type)}`;
  }
  if (!Array.isArray(record.files)) return 'missing "files" array';
  return null;
}

/** @type {string[]} */
let files = [];
try {
  files = (await readdir(REGISTRY_DIR)).filter((name) => name.endsWith(".json"));
} catch {
  console.log("validate-registry: no apps/web/public/r directory yet (built in Phase 3)");
  process.exit(0);
}

let failures = 0;
for (const file of files) {
  try {
    const item = JSON.parse(await readFile(new URL(file, REGISTRY_DIR), "utf8"));
    const error = validateItem(file, item);
    if (error) {
      failures += 1;
      console.error(`validate-registry: ${file}: ${error}`);
    }
  } catch (err) {
    failures += 1;
    console.error(`validate-registry: ${file}: ${err instanceof Error ? err.message : err}`);
  }
}

console.log(`validate-registry: ${files.length} file(s) checked, ${failures} failure(s)`);
process.exit(failures > 0 ? 1 : 0);
