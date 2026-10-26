import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createHttpClient } from "@/shared/api";

import { createAuctionApi } from "./auction-api";

const BASE_URL = "http://gateway.test";

describe("auctionApi", () => {
  const fetchMock = vi.fn<typeof fetch>();
  const api = createAuctionApi(createHttpClient(BASE_URL));

  function requestedUrl(): string {
    return String(fetchMock.mock.calls[0][0]);
  }

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    // A fresh Response per call: a body can only be read once.
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response("{}", { headers: { "Content-Type": "application/json" } }),
      ),
    );
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("goes through the gateway, never a service port", async () => {
    await api.listAuctions();

    expect(requestedUrl()).toBe(`${BASE_URL}/api/auctions`);
  });

  it("passes the status filter and paging through", async () => {
    await api.listAuctions({ status: "Live", page: 2, pageSize: 12 });

    expect(requestedUrl()).toBe(
      `${BASE_URL}/api/auctions?status=Live&page=2&pageSize=12`,
    );
  });

  it("reads a single auction", async () => {
    await api.getAuction("auction-1");

    expect(requestedUrl()).toBe(`${BASE_URL}/api/auctions/auction-1`);
  });

  it("defaults the bid history size", async () => {
    await api.listBids("auction-1");

    expect(requestedUrl()).toBe(
      `${BASE_URL}/api/auctions/auction-1/bids?take=50`,
    );
  });

  it("posts a bid with the bidder identity, the REST fallback path", async () => {
    await api.placeBid("auction-1", {
      amount: 1_200,
      bidderId: "u-kemal",
      bidderName: "Kemal",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(`${BASE_URL}/api/auctions/auction-1/bids`);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      amount: 1_200,
      bidderId: "u-kemal",
      bidderName: "Kemal",
    });
  });

  it("creates an auction for a product", async () => {
    await api.createAuction({
      productId: "product-1",
      minimumIncrement: 50,
      durationMinutes: 10,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(`${BASE_URL}/api/auctions`);
    expect(JSON.parse(String(init?.body))).toMatchObject({
      productId: "product-1",
    });
  });

  it("posts the operator actions", async () => {
    await api.startAuction("auction-1");
    await api.cancelAuction("auction-1");

    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      `${BASE_URL}/api/auctions/auction-1/start`,
      `${BASE_URL}/api/auctions/auction-1/cancel`,
    ]);
  });
});
