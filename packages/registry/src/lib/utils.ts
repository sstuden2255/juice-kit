/**
 * Joins class names, skipping falsy values.
 *
 * Registry items reference `cn` from `@/lib/utils`, which in a shadcn/ui project is the
 * clsx + tailwind-merge version (a `registryDependencies: ["utils"]` entry installs it). This
 * dependency-free variant keeps the monorepo at zero runtime deps beyond Motion; it does not
 * resolve conflicting Tailwind utilities, so component defaults use the least specific class
 * that works and let consumer classes come last.
 */
export type ClassValue = string | number | null | undefined | false;

export function cn(...inputs: ClassValue[]): string {
  let out = "";
  for (const input of inputs) {
    if (!input && input !== 0) continue;
    out += (out ? " " : "") + String(input);
  }
  return out;
}
