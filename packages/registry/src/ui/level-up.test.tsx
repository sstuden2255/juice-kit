import { render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { setReducedMotion } from "../../test/reduced-motion";
import { LevelUp } from "./level-up";
import type { LevelUpHandle } from "./level-up";

describe("LevelUp", () => {
  test("renders both levels and an accessible summary", () => {
    render(<LevelUp level={8} />);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("Level 7 to level 8")).toHaveClass("sr-only");
    expect(screen.getByText("Level up")).toBeInTheDocument();
  });

  test("play() resolves, fires onComplete and announces the new level (reduced motion)", async () => {
    setReducedMotion(true);
    const ref = createRef<LevelUpHandle>();
    const onComplete = vi.fn();
    render(<LevelUp ref={ref} level={5} from={3} onComplete={onComplete} />);
    await ref.current!.play();
    expect(onComplete).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Level 5"));
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("screenFlash renders a fixed overlay only when requested", () => {
    const { container, rerender } = render(<LevelUp level={2} />);
    expect(container.querySelector("[data-flash]")).toBeNull();
    rerender(<LevelUp level={2} screenFlash />);
    expect(container.querySelector("[data-flash]")).toHaveClass("fixed", "inset-0");
  });

  test("the open prop plays with full motion and completes", async () => {
    const onComplete = vi.fn();
    const { rerender } = render(<LevelUp level={10} open={false} onComplete={onComplete} />);
    rerender(<LevelUp level={10} open onComplete={onComplete} />);
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1), { timeout: 6000 });
  }, 8000);
});
