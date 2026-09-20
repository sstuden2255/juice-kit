import { render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { setReducedMotion } from "../../test/reduced-motion";
import { ShineSweep } from "./shine-sweep";
import type { ShineSweepHandle } from "./shine-sweep";

describe("ShineSweep", () => {
  test("renders children with a decorative highlight strip", () => {
    render(<ShineSweep>Badge</ShineSweep>);
    const wrapper = screen.getByText("Badge");
    expect(wrapper).toHaveClass("overflow-hidden");
    const strip = wrapper.querySelector("[data-shine-strip]");
    expect(strip).toHaveAttribute("aria-hidden", "true");
    expect(strip).toHaveClass("pointer-events-none");
  });

  test("play() resolves and fires onComplete", async () => {
    const ref = createRef<ShineSweepHandle>();
    const onComplete = vi.fn();
    render(
      <ShineSweep ref={ref} duration={0.05} onComplete={onComplete}>
        Badge
      </ShineSweep>,
    );
    await ref.current!.play();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test("the active prop triggers a sweep", async () => {
    const onComplete = vi.fn();
    const { rerender } = render(
      <ShineSweep duration={0.05} onComplete={onComplete}>
        Badge
      </ShineSweep>,
    );
    expect(onComplete).not.toHaveBeenCalled();
    rerender(
      <ShineSweep active duration={0.05} onComplete={onComplete}>
        Badge
      </ShineSweep>,
    );
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  });

  test("under reduced motion it fades instead of sweeping", async () => {
    setReducedMotion(true);
    const ref = createRef<ShineSweepHandle>();
    render(<ShineSweep ref={ref}>Badge</ShineSweep>);
    const wrapper = screen.getByText("Badge");
    expect(wrapper).toHaveAttribute("data-reduced-motion", "true");
    const strip = wrapper.querySelector<HTMLElement>("[data-shine-strip]")!;
    expect(strip.style.transform).toBe("");
    await ref.current!.play();
  });
});
