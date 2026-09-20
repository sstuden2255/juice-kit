import { act, render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { setReducedMotion } from "../../test/reduced-motion";
import { XPBar } from "./xp-bar";
import type { XPBarHandle } from "./xp-bar";

describe("XPBar", () => {
  test("renders an accessible progressbar with the default label", () => {
    render(<XPBar defaultValue={40} max={100} defaultLevel={3} />);
    const bar = screen.getByRole("progressbar", { name: "Level 3 progress" });
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(screen.getByText("Level 3")).toBeInTheDocument();
    expect(screen.getByText("40")).toHaveClass("sr-only");
  });

  test("gain() updates an uncontrolled bar", () => {
    const ref = createRef<XPBarHandle>();
    render(<XPBar ref={ref} defaultValue={10} max={100} />);
    act(() => ref.current!.gain(25));
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "35");
    expect(ref.current!.getState()).toEqual({ value: 35, max: 100, level: 1 });
  });

  test("gain() on a controlled bar reports through onChange", () => {
    const ref = createRef<XPBarHandle>();
    const onChange = vi.fn();
    render(<XPBar ref={ref} value={10} max={100} onChange={onChange} />);
    act(() => ref.current!.gain(5));
    expect(onChange).toHaveBeenCalledWith(15);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "10");
  });

  test("crossing max fires onLevelUp and carries the overflow (reduced motion)", async () => {
    setReducedMotion(true);
    const ref = createRef<XPBarHandle>();
    const onLevelUp = vi.fn();
    render(<XPBar ref={ref} defaultValue={90} max={100} defaultLevel={2} onLevelUp={onLevelUp} />);
    act(() => ref.current!.gain(30));
    await waitFor(() => expect(onLevelUp).toHaveBeenCalledWith({ level: 3, overflow: 20 }));
    await waitFor(() =>
      expect(screen.getByRole("progressbar", { name: "Level 3 progress" })).toHaveAttribute(
        "aria-valuenow",
        "20",
      ),
    );
    expect(screen.getByText("Level 3", { selector: "[aria-live]" })).toBeInTheDocument();
    expect(onLevelUp).toHaveBeenCalledTimes(1);
  });

  test("a controlled parent applies the overflow itself", async () => {
    setReducedMotion(true);
    const onLevelUp = vi.fn();
    const { rerender } = render(<XPBar value={50} max={100} level={1} onLevelUp={onLevelUp} />);
    rerender(<XPBar value={120} max={100} level={1} onLevelUp={onLevelUp} />);
    await waitFor(() => expect(onLevelUp).toHaveBeenCalledWith({ level: 2, overflow: 20 }));
    rerender(<XPBar value={20} max={100} level={2} onLevelUp={onLevelUp} />);
    expect(screen.getByRole("progressbar", { name: "Level 2 progress" })).toHaveAttribute(
      "aria-valuenow",
      "20",
    );
    expect(onLevelUp).toHaveBeenCalledTimes(1);
  });

  test("animates the fill and still levels up without reduced motion", async () => {
    const onLevelUp = vi.fn();
    const ref = createRef<XPBarHandle>();
    render(
      <XPBar
        ref={ref}
        defaultValue={95}
        max={100}
        onLevelUp={onLevelUp}
        transition={{ duration: 0.05 }}
      />,
    );
    act(() => ref.current!.gain(10));
    await waitFor(() => expect(onLevelUp).toHaveBeenCalledWith({ level: 2, overflow: 5 }), {
      timeout: 3000,
    });
  });

  test("custom and hidden labels", () => {
    const { rerender } = render(
      <XPBar defaultValue={1} max={10} label={(s) => <em>{`${s.value}/${s.max}`}</em>} />,
    );
    expect(screen.getByText("1/10")).toBeInTheDocument();
    rerender(<XPBar defaultValue={1} max={10} label={null} />);
    expect(screen.queryByText("Level 1")).not.toBeInTheDocument();
  });
});
