"use client";

import { useBidder } from "@/features/bidder/hooks/use-bidder";

import { AuctionRoom, AuctionRoomSkeleton } from "./auction-room";

/**
 * Entry point for the room route.
 *
 * The hub URL carries the bidder identity, so the connection cannot be opened
 * until that identity has been read from storage on the client.
 */
export function AuctionRoomScreen({ auctionId }: { auctionId: string }) {
  const { bidder } = useBidder();

  if (!bidder) return <AuctionRoomSkeleton />;

  return <AuctionRoom auctionId={auctionId} bidder={bidder} />;
}
