import { render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, test } from "vitest";
import { setReducedMotion } from "../../test/reduced-motion";
import { ParticleCanvas } from "./particle-canvas";
import type { ParticleCanvasHandle } from "./particle-canvas";

const engineOptions = { requestFrame: () => 1, cancelFrame: () => {} };

describe("ParticleCanvas", () => {
  test("renders a decorative, pointer-transparent canvas", () => {
    const { container } = render(<ParticleCanvas engineOptions={engineOptions} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(canvas).toHaveClass("pointer-events-none", "absolute", "inset-0");
  });

  test("the handle bursts particles at the canvas center by default", () => {
    const ref = createRef<ParticleCanvasHandle>();
    render(<ParticleCanvas ref={ref} engineOptions={engineOptions} />);
    ref.current!.burst({ count: 12 });
    expect(ref.current!.activeCount).toBe(12);
    ref.current!.clear();
    expect(ref.current!.activeCount).toBe(0);
  });

  test("does nothing when the user prefers reduced motion", () => {
    setReducedMotion(true);
    const ref = createRef<ParticleCanvasHandle>();
    const { container } = render(<ParticleCanvas ref={ref} engineOptions={engineOptions} />);
    ref.current!.burst({ count: 12 });
    ref.current!.fountain();
    expect(ref.current!.activeCount).toBe(0);
    expect(container.querySelector("canvas")).toHaveAttribute("data-reduced-motion", "true");
  });

  test("the reducedMotion prop overrides the system preference", () => {
    setReducedMotion(true);
    const ref = createRef<ParticleCanvasHandle>();
    render(<ParticleCanvas ref={ref} reducedMotion={false} engineOptions={engineOptions} />);
    ref.current!.burst({ count: 3 });
    expect(ref.current!.activeCount).toBe(3);
  });
});
