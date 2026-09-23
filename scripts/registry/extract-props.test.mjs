import { describe, expect, it } from "vitest";
import { extractApi, splitDefault } from "./extract-props.mjs";

describe("splitDefault", () => {
  it("separates a trailing default from the description", () => {
    expect(splitDefault("Seconds per sweep. Default 1.1.")).toEqual({
      description: "Seconds per sweep.",
      defaultValue: "1.1",
    });
  });

  it("accepts the colon form and strips backticks", () => {
    expect(splitDefault("Badge content. Default: `a star`.")).toEqual({
      description: "Badge content.",
      defaultValue: "a star",
    });
  });

  it("keeps periods that are not sentence ends", () => {
    expect(
      splitDefault("Highlight color. Default `var(--juice-shine, rgba(1, 1, 1, 0.7))`."),
    ).toEqual({
      description: "Highlight color.",
      defaultValue: "var(--juice-shine, rgba(1, 1, 1, 0.7))",
    });
  });

  it("treats lowercase 'defaults to' as prose, not a value", () => {
    const text = "Force reduced motion on or off; defaults to the user's OS preference.";
    expect(splitDefault(text)).toEqual({ description: text, defaultValue: null });
  });

  it("returns the text unchanged when there is no default", () => {
    expect(splitDefault("The level being reached.")).toEqual({
      description: "The level being reached.",
      defaultValue: null,
    });
  });
});

describe("extractApi", () => {
  const source = `
    import type { ComponentPropsWithoutRef } from "react";

    /** How rare the achievement is. */
    export type Rarity = "common" | "legendary";

    export interface WidgetHandle {
      /** Run the sequence. */
      play(): Promise<void>;
    }

    export interface WidgetProps extends ComponentPropsWithoutRef<"div"> {
      /** The level being reached. */
      level: number;
      /** Text above the number. Default "Level up". */
      label?: string;
    }

    interface Hidden {
      secret: string;
    }
  `;

  const api = extractApi("widget.tsx", source);

  it("extracts exported interfaces and skips unexported ones", () => {
    expect(api.interfaces.map((entry) => entry.name)).toEqual(["WidgetHandle", "WidgetProps"]);
  });

  it("records the heritage clause instead of expanding inherited props", () => {
    const props = api.interfaces.find((entry) => entry.name === "WidgetProps");
    expect(props?.extends).toBe('ComponentPropsWithoutRef<"div">');
    expect(props?.members.map((member) => member.name)).toEqual(["level", "label"]);
  });

  it("captures optionality, type text, docs and defaults", () => {
    const props = api.interfaces.find((entry) => entry.name === "WidgetProps");
    expect(props?.members).toEqual([
      {
        name: "level",
        optional: false,
        type: "number",
        description: "The level being reached.",
        defaultValue: null,
      },
      {
        name: "label",
        optional: true,
        type: "string",
        description: "Text above the number.",
        defaultValue: '"Level up"',
      },
    ]);
  });

  it("prints a method signature without its name", () => {
    const handle = api.interfaces.find((entry) => entry.name === "WidgetHandle");
    expect(handle?.members[0]).toMatchObject({ name: "play", type: "(): Promise<void>" });
  });

  it("extracts exported type aliases", () => {
    expect(api.types).toEqual([{ name: "Rarity", text: '"common" | "legendary"' }]);
  });
});
