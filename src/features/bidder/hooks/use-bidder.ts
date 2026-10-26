"use client";

import { useSyncExternalStore } from "react";

import type { Bidder } from "../model/bidder";
import {
  getBidderServerSnapshot,
  getBidderSnapshot,
  regenerateBidder,
  renameBidder,
  subscribeToBidder,
} from "../model/bidder-store";

export interface BidderHandle {
  /** `null` on the server and during hydration, then the stored identity. */
  bidder: Bidder | null;
  rename: (name: string) => void;
  regenerate: () => void;
}

export function useBidder(): BidderHandle {
  const bidder = useSyncExternalStore(
    subscribeToBidder,
    getBidderSnapshot,
    getBidderServerSnapshot,
  );

  return { bidder, rename: renameBidder, regenerate: regenerateBidder };
}
