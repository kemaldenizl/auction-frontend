import { describe, expect, it } from "vitest";

import { buildHubUrl } from "./signalr-auction-hub";

describe("buildHubUrl", () => {
  it("carries the bidder identity as query parameters", () => {
    const url = new URL(
      buildHubUrl("http://localhost:5080", { id: "u-kemal", name: "Kemal" }),
    );

    expect(url.pathname).toBe("/hubs/auction");
    expect(url.searchParams.get("bidderId")).toBe("u-kemal");
    expect(url.searchParams.get("bidderName")).toBe("Kemal");
  });

  it("encodes a name with spaces and non-ASCII characters", () => {
    const url = new URL(
      buildHubUrl("http://localhost:5080", {
        id: "u-1",
        name: "Ayşe Yılmaz",
      }),
    );

    expect(url.searchParams.get("bidderName")).toBe("Ayşe Yılmaz");
  });
});
