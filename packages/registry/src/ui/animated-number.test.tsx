import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { setReducedMotion } from "../../test/reduced-motion";
import { AnimatedNumber, odometerPosition } from "./animated-number";

describe("odometerPosition", () => {
  test("the lowest digit rolls continuously", () => {
    expect(odometerPosition(4.5, 0)).toBeCloseTo(4.5);
    expect(odometerPosition(9.25, 0)).toBeCloseTo(9.25);
  });

  test("a higher digit only rolls while every lower digit is a 9", () => {
    expect(odometerPosition(45.5, 1)).toBe(4);
    expect(odometerPosition(49.5, 1)).toBeCloseTo(4.5);
    expect(odometerPosition(199.5, 2)).toBeCloseTo(1.5);
    expect(odometerPosition(189.5, 2)).toBe(1);
  });
});

describe("AnimatedNumber", () => {
  test("exposes the formatted value to assistive tech and one column per digit", () => {
    render(<AnimatedNumber value={1234} />);
    expect(screen.getByText("1,234")).toHaveClass("sr-only");
    const container = screen.getByText("1,234").parentElement!;
    const columns = container.querySelectorAll<HTMLElement>("[data-digit]");
    expect(columns).toHaveLength(4);
    // Each column's stack is offset by whole digit rows (1em each), most significant first.
    const offsets = Array.from(columns).map(
      (column) => column.querySelector<HTMLElement>("[aria-hidden='true']")!.style.transform,
    );
    expect(offsets).toEqual([
      "translateY(-1em)",
      "translateY(-2em)",
      "translateY(-3em)",
      "translateY(-4em)",
    ]);
  });

  test("formats with Intl options and locale", () => {
    render(<AnimatedNumber value={1234.5} locale="de-DE" format={{ minimumFractionDigits: 2 }} />);
    expect(screen.getByText("1.234,50")).toBeInTheDocument();
  });

  test("under reduced motion the value changes instantly and completion fires", async () => {
    setReducedMotion(true);
    const onComplete = vi.fn();
    const { rerender } = render(<AnimatedNumber value={10} onComplete={onComplete} />);
    expect(onComplete).toHaveBeenCalledTimes(1);
    rerender(<AnimatedNumber value={250} onComplete={onComplete} />);
    expect(screen.getByText("250")).toBeInTheDocument();
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(2));
    expect(screen.getByText("250").parentElement).toHaveAttribute("data-reduced-motion", "true");
  });

  test("animates to a new value and reports completion", async () => {
    const onComplete = vi.fn();
    const { rerender } = render(<AnimatedNumber value={0} onComplete={onComplete} />);
    rerender(<AnimatedNumber value={99} onComplete={onComplete} transition={{ duration: 0.05 }} />);
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(2), { timeout: 2000 });
    expect(screen.getByText("99")).toBeInTheDocument();
  });
});
