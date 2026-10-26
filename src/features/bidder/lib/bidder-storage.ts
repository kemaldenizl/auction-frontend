import type { Bidder } from "../model/bidder";

export const BIDDER_STORAGE_KEY = "auction.bidder";

function randomToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

export function createGuestBidder(): Bidder {
  const token = randomToken();
  return { id: `u-${token}`, name: `Konuk ${token.slice(0, 4).toUpperCase()}` };
}

function isBidder(value: unknown): value is Bidder {
  if (value === null || typeof value !== "object") return false;
  const candidate = value as Partial<Bidder>;
  return (
    typeof candidate.id === "string" &&
    candidate.id.length > 0 &&
    typeof candidate.name === "string" &&
    candidate.name.length > 0
  );
}

/**
 * `Storage` can throw outright in a private window or with site data blocked,
 * so every access is guarded and a failure simply means "no stored identity".
 */
export function readBidder(storage: Storage | undefined): Bidder | null {
  if (!storage) return null;

  try {
    const raw = storage.getItem(BIDDER_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isBidder(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeBidder(
  storage: Storage | undefined,
  bidder: Bidder,
): void {
  if (!storage) return;

  try {
    storage.setItem(BIDDER_STORAGE_KEY, JSON.stringify(bidder));
  } catch {
    // Nothing to do: the identity stays in memory for this session only.
  }
}

/** Reads the stored identity, creating and persisting a guest one if absent. */
export function loadBidder(storage: Storage | undefined): Bidder {
  const stored = readBidder(storage);
  if (stored) return stored;

  const guest = createGuestBidder();
  writeBidder(storage, guest);
  return guest;
}

export function browserStorage(): Storage | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}
