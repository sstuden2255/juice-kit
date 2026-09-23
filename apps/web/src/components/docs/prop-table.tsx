import type { ReactNode } from "react";
import type { RegistryInterface } from "@/lib/registry";

/**
 * JSDoc marks inline code with backticks, so a description reaches us as
 * "receives the new XP after `gain()`". Render those spans as code instead of literal ticks.
 */
function withInlineCode(text: string): ReactNode[] {
  return text.split(/`([^`]+)`/g).map((part, index) =>
    index % 2 === 1 ? (
      <code key={index} className="font-mono text-[13px]">
        {part}
      </code>
    ) : (
      part
    ),
  );
}

export interface PropTableProps {
  api: RegistryInterface;
  /** Heading above the table. */
  title: string;
  /** Optional sentence under the heading. */
  description?: string;
}

/**
 * Renders one exported interface as a table. The rows come from
 * scripts/registry/extract-props.mjs, so they are generated from the component's own types and
 * JSDoc rather than maintained by hand.
 */
export function PropTable({ api, title, description }: PropTableProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        {description !== undefined && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {api.members.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
            <thead className="bg-muted/50 text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  Name
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Type
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Default
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {api.members.map((member) => (
                <tr key={member.name} className="border-t border-border align-top">
                  <td className="px-3 py-2 font-mono text-[13px] whitespace-nowrap">
                    {member.name}
                    {member.optional ? (
                      <span className="text-muted-foreground">?</span>
                    ) : (
                      <span className="ml-1 text-[10px] tracking-wide text-muted-foreground uppercase">
                        required
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-[13px] text-muted-foreground">
                    {member.type}
                  </td>
                  <td className="px-3 py-2 font-mono text-[13px] text-muted-foreground">
                    {member.defaultValue ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {member.description ? withInlineCode(member.description) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {api.extends !== null && (
        <p className="text-sm text-muted-foreground">
          Also accepts every prop of <code className="font-mono">{api.extends}</code>, which is
          spread onto the root element.
        </p>
      )}
    </section>
  );
}
