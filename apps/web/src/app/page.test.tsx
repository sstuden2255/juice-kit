import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import HomePage from "./page";

test("renders the pitch and a route into the docs", () => {
  render(<HomePage />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/feel like something/i);
  expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute("href", "/docs");
});
