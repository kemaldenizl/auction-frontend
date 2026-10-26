import type { Metadata } from "next";
import { Suspense } from "react";

import { AuctionRoomSkeleton } from "@/features/auction/components/auction-room";
import { AuctionRoomScreen } from "@/features/auction/components/auction-room-screen";

export const metadata: Metadata = { title: "Açık arttırma odası" };

/**
 * The room deliberately does no server read.
 *
 * `JoinAuction` subscribes and returns the snapshot in a single call, so there
 * is no window between "fetched the state" and "started listening" in which a
 * bid could be missed.
 */
export default function AuctionRoomPage(props: PageProps<"/auctions/[id]">) {
  return (
    <Suspense fallback={<AuctionRoomSkeleton />}>
      {props.params.then(({ id }) => (
        <AuctionRoomScreen auctionId={id} />
      ))}
    </Suspense>
  );
}
