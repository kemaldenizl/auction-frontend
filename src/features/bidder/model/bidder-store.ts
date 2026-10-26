import {
  browserStorage,
  createGuestBidder,
  loadBidder,
  writeBidder,
} from "../lib/bidder-storage";
import type { Bidder } from "./bidder";

/**
 * The local identity as an external store, read through
 * `useSyncExternalStore`.
 *
 * A plain `useState` + `useEffect` pair would have to call `setState` straight
 * from the effect body to pick the value up from `localStorage`. This shape
 * says what is actually happening — React is subscribing to something outside
 * of it — and keeps the server snapshot explicit.
 *
 * Deliberately not listening for `storage` events: two tabs are supposed to be
 * able to bid as different people, which is how you watch `Outbid` arrive.
 */

let current: Bidder | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeToBidder(listener: () => void): () => void {
  listeners.add(listener);

  // First subscriber triggers the read: `subscribe` runs inside an effect, so
  // touching storage here is safe, unlike inside `getSnapshot`.
  if (current === null) {
    current = loadBidder(browserStorage());
    emit();
  }

  return () => {
    listeners.delete(listener);
  };
}

export function getBidderSnapshot(): Bidder | null {
  return current;
}

/** No storage on the server, so there is no identity to report yet. */
export function getBidderServerSnapshot(): Bidder | null {
  return null;
}

export function renameBidder(name: string): void {
  const trimmed = name.trim();
  if (!current || trimmed === "" || trimmed === current.name) return;

  current = { ...current, name: trimmed };
  writeBidder(browserStorage(), current);
  emit();
}

/** New id and name, so a second tab can bid as someone else. */
export function regenerateBidder(): void {
  current = createGuestBidder();
  writeBidder(browserStorage(), current);
  emit();
}

/** Test seam: drops the cached identity and every subscriber. */
export function resetBidderStore(): void {
  current = null;
  listeners.clear();
}
