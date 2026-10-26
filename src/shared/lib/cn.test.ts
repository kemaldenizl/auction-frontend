import { describe, expect, it } from "vitest";

import { cn } from "./cn";

describe("cn", () => {
  it("joins the truthy values", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values, which is how conditional classes are written", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("flattens nested arrays", () => {
    expect(cn("a", ["b", ["c", false]], "d")).toBe("a b c d");
  });

  it("keeps a zero, since it is a valid class fragment", () => {
    expect(cn("gap", 0)).toBe("gap 0");
  });
});
