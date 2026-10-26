import { describe, expect, it, vi } from "vitest";

import {
  BIDDER_STORAGE_KEY,
  createGuestBidder,
  loadBidder,
  readBidder,
  writeBidder,
} from "./bidder-storage";

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));

  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
}

/** Storage can throw outright when site data is blocked. */
function hostileStorage(): Storage {
  return {
    length: 0,
    clear: () => {},
    getItem: () => {
      throw new Error("access denied");
    },
    key: () => null,
    removeItem: () => {},
    setItem: () => {
      throw new Error("quota exceeded");
    },
  };
}

describe("createGuestBidder", () => {
  it("produces a usable identity", () => {
    const bidder = createGuestBidder();

    expect(bidder.id).toMatch(/^u-/);
    expect(bidder.name.length).toBeGreaterThan(0);
  });

  it("gives each call a distinct id, so two tabs can bid separately", () => {
    expect(createGuestBidder().id).not.toBe(createGuestBidder().id);
  });
});

describe("readBidder", () => {
  it("reads a stored identity", () => {
    const storage = memoryStorage({
      [BIDDER_STORAGE_KEY]: '{"id":"u-1","name":"Kemal"}',
    });

    expect(readBidder(storage)).toEqual({ id: "u-1", name: "Kemal" });
  });

  it("rejects a malformed or incomplete payload", () => {
    expect(
      readBidder(memoryStorage({ [BIDDER_STORAGE_KEY]: "not json" })),
    ).toBeNull();
    expect(
      readBidder(memoryStorage({ [BIDDER_STORAGE_KEY]: '{"id":"u-1"}' })),
    ).toBeNull();
    expect(
      readBidder(memoryStorage({ [BIDDER_STORAGE_KEY]: '{"id":"","name":"x"}' })),
    ).toBeNull();
  });

  it("returns null without storage, as on the server", () => {
    expect(readBidder(undefined)).toBeNull();
  });

  it("survives storage that throws", () => {
    expect(readBidder(hostileStorage())).toBeNull();
  });
});

describe("writeBidder", () => {
  it("persists the identity", () => {
    const storage = memoryStorage();

    writeBidder(storage, { id: "u-1", name: "Kemal" });

    expect(storage.getItem(BIDDER_STORAGE_KEY)).toBe(
      '{"id":"u-1","name":"Kemal"}',
    );
  });

  it("swallows a write that is not allowed", () => {
    expect(() =>
      writeBidder(hostileStorage(), { id: "u-1", name: "Kemal" }),
    ).not.toThrow();
  });
});

describe("loadBidder", () => {
  it("prefers the stored identity", () => {
    const storage = memoryStorage({
      [BIDDER_STORAGE_KEY]: '{"id":"u-1","name":"Kemal"}',
    });

    expect(loadBidder(storage)).toEqual({ id: "u-1", name: "Kemal" });
  });

  it("creates and persists a guest on the first visit", () => {
    const storage = memoryStorage();
    const setItem = vi.spyOn(storage, "setItem");

    const bidder = loadBidder(storage);

    expect(setItem).toHaveBeenCalledOnce();
    expect(readBidder(storage)).toEqual(bidder);
  });

  it("still returns an identity when nothing can be stored", () => {
    expect(loadBidder(hostileStorage()).id).toMatch(/^u-/);
  });
});
