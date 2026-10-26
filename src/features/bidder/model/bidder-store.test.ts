import { afterEach, describe, expect, it, vi } from "vitest";

import { BIDDER_STORAGE_KEY } from "../lib/bidder-storage";
import {
  getBidderServerSnapshot,
  getBidderSnapshot,
  regenerateBidder,
  renameBidder,
  resetBidderStore,
  subscribeToBidder,
} from "./bidder-store";

afterEach(() => {
  resetBidderStore();
  window.localStorage.clear();
});

describe("bidder store", () => {
  it("has nothing before the first subscriber, matching the server snapshot", () => {
    expect(getBidderSnapshot()).toBeNull();
    expect(getBidderServerSnapshot()).toBeNull();
  });

  it("loads the identity on subscribe and notifies", () => {
    const listener = vi.fn();

    subscribeToBidder(listener);

    expect(listener).toHaveBeenCalled();
    expect(getBidderSnapshot()?.id).toMatch(/^u-/);
  });

  it("reuses the identity already in storage", () => {
    window.localStorage.setItem(
      BIDDER_STORAGE_KEY,
      '{"id":"u-kemal","name":"Kemal"}',
    );

    subscribeToBidder(vi.fn());

    expect(getBidderSnapshot()).toEqual({ id: "u-kemal", name: "Kemal" });
  });

  it("renames, persists and notifies", () => {
    const listener = vi.fn();
    subscribeToBidder(listener);
    listener.mockClear();

    renameBidder("  Kemal  ");

    expect(getBidderSnapshot()?.name).toBe("Kemal");
    expect(listener).toHaveBeenCalledOnce();
    expect(window.localStorage.getItem(BIDDER_STORAGE_KEY)).toContain("Kemal");
  });

  it("ignores a rename that changes nothing, so the socket is not rebuilt", () => {
    const listener = vi.fn();
    subscribeToBidder(listener);
    const before = getBidderSnapshot();
    listener.mockClear();

    renameBidder("   ");
    renameBidder(before?.name ?? "");

    expect(getBidderSnapshot()).toBe(before);
    expect(listener).not.toHaveBeenCalled();
  });

  it("regenerates a fresh id, which is how a second tab bids as someone else", () => {
    subscribeToBidder(vi.fn());
    const before = getBidderSnapshot();

    regenerateBidder();

    expect(getBidderSnapshot()?.id).not.toBe(before?.id);
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToBidder(listener);
    listener.mockClear();

    unsubscribe();
    regenerateBidder();

    expect(listener).not.toHaveBeenCalled();
  });
});
