import { describe, expect, it } from "vitest";

import { formatDuration, formatMoney, formatMoneyPrecise } from "./format";

describe("formatMoney", () => {
  it("groups thousands and hides kuruş", () => {
    const formatted = formatMoney(1_234_567);

    expect(formatted).toContain("1.234.567");
    expect(formatted).not.toContain(",");
  });

  it("keeps kuruş in the precise variant", () => {
    expect(formatMoneyPrecise(1_050.5)).toContain("1.050,50");
  });
});

describe("formatDuration", () => {
  it("shows minutes and seconds under an hour", () => {
    expect(formatDuration(65_000)).toBe("01:05");
  });

  it("adds hours above an hour", () => {
    expect(formatDuration(3_600_000 + 5 * 60_000 + 9_000)).toBe("1:05:09");
  });

  it("floors to whole seconds", () => {
    expect(formatDuration(1_999)).toBe("00:01");
  });

  it("clamps a finished countdown to zero", () => {
    expect(formatDuration(-5_000)).toBe("00:00");
  });
});
