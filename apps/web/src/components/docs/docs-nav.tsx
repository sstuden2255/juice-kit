"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@juicekit/registry/lib/utils";

export interface DocsNavGroup {
  label: string;
  links: { href: string; label: string }[];
}

export function DocsNav({ groups }: { groups: DocsNavGroup[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Documentation" className="flex flex-col gap-6 text-sm">
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {group.label}
          </p>
          {group.links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-2 py-1 transition-colors",
                  active
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
