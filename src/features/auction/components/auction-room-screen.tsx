"use client";

import { useSession } from "@/features/auth/hooks/use-session";

import { AuctionPreview } from "./auction-preview";
import { AuctionRoom, AuctionRoomSkeleton } from "./auction-room";

/**
 * Entry point for the room route.
 *
 * The hub is `[Authorize]`d, so a signed-out visitor gets the public REST view
 * instead of being bounced to the login page — the auction is readable either
 * way, only the live feed and bidding are not.
 */
export function AuctionRoomScreen({ auctionId }: { auctionId: string }) {
  const { status, identity } = useSession();

  if (status === "loading") return <AuctionRoomSkeleton />;
  if (status === "anonymous") return <AuctionPreview auctionId={auctionId} />;

  return (
    <AuctionRoom auctionId={auctionId} sessionKey={identity?.sessionId ?? ""} />
  );
}
