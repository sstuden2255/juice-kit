import type { ReactNode } from "react";
import { DocsNav } from "@/components/docs/docs-nav";
import type { DocsNavGroup } from "@/components/docs/docs-nav";
import { SiteHeader } from "@/components/site/site-header";
import { getRegistry, getRegistryByCategory } from "@/lib/registry";

const CATEGORY_LABELS: Record<string, string> = {
  primitives: "Primitives",
  components: "Components",
};

export default function DocsLayout({ children }: { children: ReactNode }) {
  const groups: DocsNavGroup[] = [
    { label: "Start", links: [{ href: "/docs", label: "Getting started" }] },
    ...getRegistryByCategory().map((group) => ({
      label: CATEGORY_LABELS[group.category] ?? group.category,
      links: group.items.map((item) => ({ href: `/docs/${item.name}`, label: item.title })),
    })),
  ];

  return (
    <>
      <SiteHeader repository={getRegistry().homepage} />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 lg:flex-row lg:gap-12">
        <aside className="lg:sticky lg:top-20 lg:h-fit lg:w-52 lg:shrink-0">
          <DocsNav groups={groups} />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </>
  );
}
