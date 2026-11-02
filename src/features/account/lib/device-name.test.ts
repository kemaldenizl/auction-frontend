import { describe, expect, it } from "vitest";

import { describeDevice } from "./device-name";

describe("describeDevice", () => {
  it("names a desktop browser by browser and system", () => {
    expect(
      describeDevice(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
      ),
    ).toEqual({ label: "Chrome · macOS", kind: "desktop" });
  });

  it("tells Edge apart from the Chrome it is built on", () => {
    expect(
      describeDevice(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 Edg/120.0",
      ).label,
    ).toBe("Edge · Windows");
  });

  it("recognises a phone", () => {
    expect(
      describeDevice(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      ),
    ).toEqual({ label: "Safari · iOS", kind: "mobile" });
  });

  it("hides tool names behind a neutral label", () => {
    expect(describeDevice("curl/8.7.1").label).toBe("Diğer uygulama");
    expect(describeDevice("node").label).toBe("Diğer uygulama");
  });

  it("copes with a missing value", () => {
    expect(describeDevice(null).label).toBe("Bilinmeyen cihaz");
  });
});
