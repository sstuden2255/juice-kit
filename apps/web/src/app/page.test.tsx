import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import HomePage from "./page";

test("renders the JuiceKit heading", () => {
  render(<HomePage />);
  expect(screen.getByRole("heading", { level: 1, name: "JuiceKit" })).toBeInTheDocument();
});
