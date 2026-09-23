import type { ReactNode } from "react";
import { cn } from "@juicekit/registry/lib/utils";
import { CopyButton } from "./copy-button";

export interface CodeBlockProps {
  code: string;
  /** Shown in the header strip, e.g. the install path of the file. */
  title?: ReactNode;
  /** Cap the height and scroll; use for whole component sources. Default false. */
  scroll?: boolean;
  className?: string;
}

/**
 * A copyable code panel. Deliberately unhighlighted: syntax highlighting would mean adding a
 * highlighter dependency, and SPEC fixes the dependency list.
 */
export function CodeBlock({ code, title, scroll = false, className }: CodeBlockProps) {
  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-muted/50",
        className,
      )}
    >
      {title !== undefined && (
        <figcaption className="flex items-center justify-between gap-4 border-b border-border px-3 py-2 text-xs text-muted-foreground">
          <span className="truncate font-mono">{title}</span>
        </figcaption>
      )}
      <pre
        className={cn(
          "overflow-x-auto p-4 text-[13px] leading-relaxed",
          scroll && "max-h-[32rem] overflow-y-auto",
        )}
      >
        <code>{code}</code>
      </pre>
      <CopyButton value={code} className={cn("absolute right-2", title ? "top-11" : "top-2")} />
    </figure>
  );
}
