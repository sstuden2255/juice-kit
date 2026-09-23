import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";
import { CopyButton } from "@/components/docs/copy-button";
import { PropTable } from "@/components/docs/prop-table";
import { ComponentPreview } from "@/components/previews";
import { hasPreview } from "@/components/previews/names";
import { USAGE_EXAMPLES } from "@/content/examples";
import { getRegistryItem, getRegistryItemNames } from "@/lib/registry";
import type { RegistryInterface, RegistryItem } from "@/lib/registry";

// Every item is known at build time, so an unknown slug is a 404 rather than a render attempt.
export const dynamicParams = false;

export function generateStaticParams() {
  return getRegistryItemNames().map((slug) => ({ slug }));
}

function loadItem(slug: string): RegistryItem {
  try {
    return getRegistryItem(slug);
  } catch {
    notFound();
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = loadItem(slug);
  return { title: item.title, description: item.description };
}

/**
 * Props first, then the ref handle, then anything else the component exports. Readers look for
 * the props table; the supporting event and state shapes are reference material.
 */
function orderInterfaces(interfaces: RegistryInterface[], symbol: string): RegistryInterface[] {
  const rank = (name: string) =>
    name === `${symbol}Props` ? 0 : name === `${symbol}Handle` ? 1 : 2;
  return [...interfaces].sort((a, b) => rank(a.name) - rank(b.name));
}

function describeInterface(name: string, symbol: string): string | undefined {
  if (name === `${symbol}Props`) return undefined;
  if (name === `${symbol}Handle`) return "Available on the ref you pass to the component.";
  return undefined;
}

export default async function ComponentDocsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = loadItem(slug);
  const file = item.files[0];
  const example = USAGE_EXAMPLES[item.name];
  const cssVarNames = Object.values(item.cssVars ?? {}).flatMap((scope) => Object.keys(scope));
  const uniqueCssVars = [...new Set(cssVarNames)];

  return (
    <article className="flex max-w-3xl flex-col gap-12">
      <header className="flex flex-col gap-4">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {item.categories.join(" · ")}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">{item.title}</h1>
        <p className="text-lg text-muted-foreground">{item.description}</p>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
          <code className="min-w-0 flex-1 overflow-x-auto font-mono text-[13px] whitespace-nowrap">
            {item.meta.install}
          </code>
          <CopyButton value={item.meta.install} label="Copy" />
        </div>
      </header>

      {hasPreview(item.name) && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">Preview</h2>
          <ComponentPreview name={item.name} />
        </section>
      )}

      {example !== undefined && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">Usage</h2>
          <CodeBlock code={example} />
        </section>
      )}

      {item.meta.api.interfaces.length > 0 && (
        <section className="flex flex-col gap-8">
          <h2 className="text-2xl font-semibold tracking-tight">API</h2>
          {orderInterfaces(item.meta.api.interfaces, item.meta.symbol).map((api) => (
            <PropTable
              key={api.name}
              api={api}
              title={api.name}
              description={describeInterface(api.name, item.meta.symbol)}
            />
          ))}
          {item.meta.api.types.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold tracking-tight">Types</h3>
              <CodeBlock
                code={item.meta.api.types
                  .map((type) => `type ${type.name} = ${type.text};`)
                  .join("\n")}
              />
            </div>
          )}
        </section>
      )}

      {uniqueCssVars.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">CSS variables</h2>
          <p className="text-muted-foreground">
            Set any of these to retheme the component. The values below are the defaults the
            registry ships; each is read with a fallback, so the component works without them.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
              <thead className="bg-muted/50 text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Variable
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Light
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Dark
                  </th>
                </tr>
              </thead>
              <tbody>
                {uniqueCssVars.map((name) => (
                  <tr key={name} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-[13px]">--{name}</td>
                    <td className="px-3 py-2 font-mono text-[13px] text-muted-foreground">
                      {item.cssVars?.light?.[name] ?? "—"}
                    </td>
                    <td className="px-3 py-2 font-mono text-[13px] text-muted-foreground">
                      {item.cssVars?.dark?.[name] ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Dependencies</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <dt className="text-sm font-medium">npm</dt>
            <dd className="mt-1 font-mono text-[13px] text-muted-foreground">
              {item.dependencies.length > 0 ? item.dependencies.join(", ") : "none"}
            </dd>
          </div>
          <div className="rounded-lg border border-border p-4">
            <dt className="text-sm font-medium">Registry</dt>
            <dd className="mt-1 font-mono text-[13px] text-muted-foreground">
              {item.registryDependencies.length > 0
                ? item.registryDependencies
                    .map((url) => url.replace(/^.*\//, "").replace(/\.json$/, ""))
                    .join(", ")
                : "none"}
            </dd>
          </div>
        </dl>
      </section>

      {file && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">Source</h2>
          <p className="text-muted-foreground">
            Exactly what the CLI writes, imports already rewritten to your aliases.
          </p>
          <CodeBlock code={file.content} title={file.target} scroll />
        </section>
      )}
    </article>
  );
}
