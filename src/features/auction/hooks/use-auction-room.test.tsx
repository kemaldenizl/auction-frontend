import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Bidder } from "@/features/bidder/model/bidder";

import type { AuctionDetail } from "../model/auction";
import { HubNotReadyError } from "../realtime/auction-hub";
import { FakeAuctionHub } from "../test-support/fake-auction-hub";
import {
  AUCTION_ID,
  makeAuctionDetail,
  makeBidPlaced,
  makeBidRejected,
  makeOutbid,
} from "../test-support/fixtures";
import { useAuctionRoom } from "./use-auction-room";

const BIDDER: Bidder = { id: "u-alice", name: "Alice" };

function setup(snapshot: AuctionDetail = makeAuctionDetail()) {
  const hub = new FakeAuctionHub(snapshot);
  // Stable across renders, as the hook requires of `createHub`.
  const createHub = () => hub;

  const view = renderHook(() =>
    useAuctionRoom(AUCTION_ID, BIDDER, { createHub }),
  );

  return { hub, ...view };
}

async function setupJoined(snapshot?: AuctionDetail) {
  const view = setup(snapshot);
  await waitFor(() => expect(view.result.current.auction).not.toBeNull());
  return view;
}

describe("useAuctionRoom", () => {
  it("connects and takes its initial state from JoinAuction", async () => {
    const { hub, result } = await setupJoined();

    expect(hub.joinCalls).toEqual([AUCTION_ID]);
    expect(result.current.connection).toBe("connected");
    expect(result.current.auction?.currentPrice).toBe(1_000);
    expect(result.current.bids).toHaveLength(1);
  });

  it("applies BidPlaced as it arrives", async () => {
    const { hub, result } = await setupJoined();

    act(() => {
      hub.emit("BidPlaced", makeBidPlaced({ amount: 1_500, bidCount: 4 }));
    });

    expect(result.current.auction).toMatchObject({
      currentPrice: 1_500,
      bidCount: 4,
      highestBidderName: "Bob",
    });
    expect(result.current.bids[0].id).toBe("bid-2");
  });

  it("surfaces Outbid and BidRejected, and lets them be dismissed", async () => {
    const { hub, result } = await setupJoined();

    act(() => {
      hub.emit("Outbid", makeOutbid());
      hub.emit("BidRejected", makeBidRejected());
    });

    expect(result.current.outbid).not.toBeNull();
    expect(result.current.rejection?.errorCode).toBe("bid_too_low");

    act(() => {
      result.current.dismissOutbid();
      result.current.dismissRejection();
    });

    expect(result.current.outbid).toBeNull();
    expect(result.current.rejection).toBeNull();
  });

  it("rejoins the group after a reconnect", async () => {
    // The subtle one. `withAutomaticReconnect` restores the socket, but the
    // new ConnectionId is not in the server-side group any more: without a
    // second JoinAuction the room looks connected and goes silent.
    const { hub, result } = await setupJoined();

    act(() => hub.dropConnection());
    expect(result.current.connection).toBe("reconnecting");
    expect(result.current.canBid).toBe(false);

    hub.snapshot = makeAuctionDetail({ currentPrice: 4_000, bidCount: 9 });
    act(() => hub.restoreConnection());

    // Wait on the state, not on the call count: `joinCalls` grows the moment
    // join() is invoked, while the snapshot only lands once it resolves.
    await waitFor(() =>
      expect(result.current.auction?.currentPrice).toBe(4_000),
    );
    expect(hub.joinCalls).toHaveLength(2);
    expect(result.current.connection).toBe("connected");
  });

  it("marks the room disconnected when the socket closes for good", async () => {
    const { hub, result } = await setupJoined();

    act(() => hub.close());

    expect(result.current.connection).toBe("disconnected");
    expect(result.current.canBid).toBe(false);
  });

  it("sends a bid over the hub and logs the invocation", async () => {
    const { hub, result } = await setupJoined();

    await act(async () => {
      await result.current.placeBid(1_200);
    });

    expect(hub.placeBidCalls).toEqual([
      { auctionId: AUCTION_ID, amount: 1_200 },
    ]);
    expect(result.current.log[0]).toMatchObject({
      channel: "invocation",
      name: "PlaceBid",
    });
  });

  it("refuses to invoke PlaceBid while disconnected", async () => {
    const { hub, result } = await setupJoined();

    act(() => hub.dropConnection());

    await expect(result.current.placeBid(1_200)).rejects.toBeInstanceOf(
      HubNotReadyError,
    );
    expect(hub.placeBidCalls).toHaveLength(0);
  });

  it("reports a failed handshake instead of hanging on the loader", async () => {
    const hub = new FakeAuctionHub(makeAuctionDetail());
    hub.startRejection = new Error("negotiate 404");
    const createHub = () => hub;

    const { result } = renderHook(() =>
      useAuctionRoom(AUCTION_ID, BIDDER, { createHub }),
    );

    await waitFor(() => expect(result.current.connection).toBe("error"));
    expect(result.current.connectionError).toBe("negotiate 404");
    expect(hub.joinCalls).toHaveLength(0);
  });

  it("stops the connection on unmount", async () => {
    const { hub, unmount } = await setupJoined();

    unmount();

    // Cleanup waits for start() to settle before calling stop().
    await waitFor(() => expect(hub.stopCalls).toBe(1));
  });

  it("ignores events from a connection it has torn down", async () => {
    // A stopped hub keeps firing until stop() settles. In StrictMode the
    // replacement effect is already running, so those events must not land on
    // the new room's state.
    const { hub, result, unmount } = await setupJoined();
    const logLength = result.current.log.length;

    unmount();
    act(() => {
      hub.close();
      hub.emit("BidPlaced", makeBidPlaced({ amount: 9_999 }));
    });

    expect(result.current.connection).toBe("connected");
    expect(result.current.auction?.currentPrice).toBe(1_000);
    expect(result.current.log).toHaveLength(logLength);
  });

  it("exposes whether the viewer holds the lead", async () => {
    const { hub, result } = await setupJoined();

    expect(result.current.isLeading).toBe(true);

    act(() => {
      hub.emit("BidPlaced", makeBidPlaced({ bidderId: "u-bob" }));
    });

    expect(result.current.isLeading).toBe(false);
  });

  it("tracks the viewer count", async () => {
    const { hub, result } = await setupJoined();

    act(() => {
      hub.emit("ViewerCountChanged", {
        auctionId: AUCTION_ID,
        viewerCount: 17,
      });
    });

    expect(result.current.viewerCount).toBe(17);
  });
});
