import { expect, test } from "vitest";
import { registry } from "./index";

test("exposes the registry identity", () => {
  expect(registry).toEqual({ name: "juicekit", version: "0.0.0" });
});
