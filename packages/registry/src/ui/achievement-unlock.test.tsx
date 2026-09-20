import { render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { setReducedMotion } from "../../test/reduced-motion";
import { AchievementUnlock } from "./achievement-unlock";
import type { AchievementUnlockHandle } from "./achievement-unlock";

describe("AchievementUnlock", () => {
  test("renders hidden from assistive tech until played, with rarity styling", () => {
    render(<AchievementUnlock title="First Blood" description="Win a match" rarity="epic" />);
    const title = screen.getByText("First Blood");
    const root = title.closest("[data-rarity]")!;
    expect(root).toHaveAttribute("data-rarity", "epic");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("epic")).toBeInTheDocument();
    expect(screen.getByText("Win a match")).toBeInTheDocument();
  });

  test("play() runs the sequence, reveals, announces and resolves (reduced motion)", async () => {
    setReducedMotion(true);
    const ref = createRef<AchievementUnlockHandle>();
    const onComplete = vi.fn();
    render(<AchievementUnlock ref={ref} title="Speedrunner" onComplete={onComplete} />);
    await ref.current!.play();
    expect(onComplete).toHaveBeenCalledTimes(1);
    const root = screen.getByText("Speedrunner").closest("[data-rarity]")!;
    expect(root).not.toHaveAttribute("aria-hidden");
    expect(root).toHaveAttribute("data-reduced-motion", "true");
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Achievement unlocked"),
    );
    ref.current!.reset();
    await waitFor(() => expect(root).toHaveAttribute("aria-hidden", "true"));
  });

  test("the open prop plays and completion fires with full motion", async () => {
    const onComplete = vi.fn();
    const { rerender } = render(
      <AchievementUnlock title="Collector" open={false} onComplete={onComplete} />,
    );
    rerender(<AchievementUnlock title="Collector" open onComplete={onComplete} />);
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1), { timeout: 6000 });
  }, 8000);

  test("defaultOpen plays once on mount", async () => {
    setReducedMotion(true);
    const onComplete = vi.fn();
    render(<AchievementUnlock title="Explorer" defaultOpen onComplete={onComplete} />);
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  });
});
