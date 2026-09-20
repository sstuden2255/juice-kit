import { expect, test } from "vitest";
import { cn } from "./utils";

test("cn joins truthy class values and skips the rest", () => {
  expect(cn("a", undefined, null, false, "b", 0, "c")).toBe("a b 0 c");
  expect(cn()).toBe("");
});
