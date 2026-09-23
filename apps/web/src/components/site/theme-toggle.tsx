"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import type { Theme } from "@/lib/theme";

/**
 * The stored choice is external state, so it is read through useSyncExternalStore rather than
 * copied into React state inside an effect: the server snapshot is "system", and the client
 * resolves to the real value during hydration without a cascading render.
 *
 * The `storage` event only fires in *other* tabs, so same-tab writes notify local subscribers
 * directly.
 */
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getSnapshot(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

const getServerSnapshot = (): Theme => "system";

/** Resolves "system" against the OS and writes the class globals.css and Tailwind both read. */
function apply(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const list = document.documentElement.classList;
  list.toggle("dark", dark);
  list.toggle("light", !dark);
}

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

/** Three-way theme switch. Persists the choice and follows the OS while set to System. */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (theme !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [theme]);

  const choose = useCallback((next: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Nothing to persist to; the class below still applies for this session.
    }
    apply(next);
    for (const listener of listeners) listener();
  }, []);

  return (
    <fieldset className="flex items-center rounded-md border border-border p-0.5">
      <legend className="sr-only">Theme</legend>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={theme === option.value}
          onClick={() => choose(option.value)}
          className="rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors aria-pressed:bg-accent aria-pressed:text-accent-foreground"
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
}
