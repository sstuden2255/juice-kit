"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@juicekit/registry/lib/utils";

export interface CopyButtonProps {
  /** Text written to the clipboard. */
  value: string;
  /** Accessible name; the visible label follows it. Default "Copy". */
  label?: string;
  className?: string;
}

/** Copy-to-clipboard control that confirms for two seconds, then returns to its resting label. */
export function CopyButton({ value, label = "Copy", className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (timeout.current && clearTimeout(timeout.current)), []);

  const copy = useCallback(() => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setCopied(false), 2000);
    });
  }, [value]);

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : label}
      className={cn(
        "rounded-md border border-border bg-background/80 px-2 py-1 text-xs font-medium backdrop-blur transition-colors hover:bg-accent hover:text-accent-foreground",
        className,
      )}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
