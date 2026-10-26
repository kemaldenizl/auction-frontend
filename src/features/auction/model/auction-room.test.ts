import { describe, expect, it } from "vitest";

import {
  MAX_FEED,
  MAX_LOG,
  auctionRoomReducer,
  canPlaceBid,
  createInitialState,
  isLeading,
  isLive,
  remainingMs,
  type AuctionRoomAction,
  type AuctionRoomState,
} from "./auction-room";
import {
  AUCTION_ID,
  ENDS_AT,
  makeAuctionDetail,
  makeAuctionEnded,
  makeAuctionStarted,
  makeBid,
  makeBidPlaced,
  makeBidRejected,
  makeOutbid,
} from "../test-support/fixtures";

const AT = Date.parse("2026-01-01T11:30:00.500Z");

function reduce(
  state: AuctionRoomState,
  ...actions: AuctionRoomAction[]
): AuctionRoomState {
  return actions.reduce(auctionRoomReducer, state);
}

function joinedState(
  detail = makeAuctionDetail(),
  at = AT,
): AuctionRoomState {
  return reduce(createInitialState(AUCTION_ID), {
    type: "room/joined",
    auction: detail,
    at,
  });
}

describe("createInitialState", () => {
  it("starts out connecting with nothing known about the auction", () => {
    const state = createInitialState(AUCTION_ID);

    expect(state).toMatchObject({
      auctionId: AUCTION_ID,
      auction: null,
      bids: [],
      viewerCount: 0,
      connection: "connecting",
      rejection: null,
      outbid: null,
      ended: null,
      serverOffsetMs: 0,
    });
  });
});

describe("room/joined", () => {
  it("takes the snapshot JoinAuction returned as the state of the room", () => {
    const detail = makeAuctionDetail();
    const state = joinedState(detail);

    expect(state.auction).toEqual(detail);
    expect(state.bids).toEqual(detail.recentBids);
  });

  it("clears a stale rejection, since rejoining brings a fresh snapshot", () => {
    const withRejection = reduce(createInitialState(AUCTION_ID), {
      type: "hub/bid-rejected",
      event: makeBidRejected(),
      at: AT,
    });

    const rejoined = reduce(withRejection, {
      type: "room/joined",
      auction: makeAuctionDetail(),
      at: AT,
    });

    expect(withRejection.rejection).not.toBeNull();
    expect(rejoined.rejection).toBeNull();
  });
});

describe("hub/bid-placed", () => {
  it("writes the server's numbers instead of deriving any of them", () => {
    const event = makeBidPlaced({
      amount: 2_000,
      minimumNextBid: 2_500,
      bidCount: 7,
      endsAt: "2026-01-01T12:05:00.000Z",
    });

    const state = reduce(joinedState(), {
      type: "hub/bid-placed",
      event,
      at: AT,
    });

    expect(state.auction).toMatchObject({
      currentPrice: 2_000,
      minimumNextBid: 2_500,
      bidCount: 7,
      highestBidderId: "u-bob",
      highestBidderName: "Bob",
      endsAt: "2026-01-01T12:05:00.000Z",
    });
  });

  it("prepends the bid to the feed", () => {
    const state = reduce(joinedState(), {
      type: "hub/bid-placed",
      event: makeBidPlaced({ bidId: "bid-2" }),
      at: AT,
    });

    expect(state.bids.map((bid) => bid.id)).toEqual(["bid-2", "bid-1"]);
  });

  it("ignores a bid id it already has, so an echo or a replay cannot double it", () => {
    const event = makeBidPlaced({ bidId: "bid-2" });

    const once = reduce(joinedState(), {
      type: "hub/bid-placed",
      event,
      at: AT,
    });
    const twice = reduce(once, { type: "hub/bid-placed", event, at: AT });

    expect(twice.bids).toHaveLength(2);
    expect(twice.bids).toBe(once.bids);
  });

  it("caps the feed", () => {
    const bids = Array.from({ length: MAX_FEED }, (_, index) =>
      makeBid({ id: `old-${index}` }),
    );

    const state = reduce(
      joinedState(makeAuctionDetail({ recentBids: bids })),
      { type: "hub/bid-placed", event: makeBidPlaced({ bidId: "new" }), at: AT },
    );

    expect(state.bids).toHaveLength(MAX_FEED);
    expect(state.bids[0].id).toBe("new");
  });

  it("drops the previous rejection, which a newer bid makes meaningless", () => {
    const state = reduce(
      joinedState(),
      { type: "hub/bid-rejected", event: makeBidRejected(), at: AT },
      { type: "hub/bid-placed", event: makeBidPlaced(), at: AT },
    );

    expect(state.rejection).toBeNull();
  });

  it("measures the clock offset from the server's own timestamp", () => {
    const event = makeBidPlaced({ createdAt: "2026-01-01T11:30:00.000Z" });

    const state = reduce(joinedState(), {
      type: "hub/bid-placed",
      event,
      at: Date.parse("2026-01-01T11:30:02.000Z"),
    });

    expect(state.serverOffsetMs).toBe(2_000);
  });

  it("keeps the previous offset when the timestamp is unparseable", () => {
    const state = reduce(joinedState(), {
      type: "hub/bid-placed",
      event: makeBidPlaced({ createdAt: "not-a-date" }),
      at: AT,
    });

    expect(state.serverOffsetMs).toBe(0);
  });

  it("ignores an event for a different auction", () => {
    const state = joinedState();

    const next = reduce(state, {
      type: "hub/bid-placed",
      event: makeBidPlaced({ auctionId: "other-auction", amount: 99_999 }),
      at: AT,
    });

    expect(next).toBe(state);
  });
});

describe("hub/bid-rejected", () => {
  it("keeps the reason and the floor the server asked for", () => {
    const state = reduce(joinedState(), {
      type: "hub/bid-rejected",
      event: makeBidRejected({ minimumRequired: 1_234 }),
      at: AT,
    });

    expect(state.rejection).toMatchObject({
      errorCode: "bid_too_low",
      minimumRequired: 1_234,
    });
  });

  it("is cleared when the bidder dismisses it", () => {
    const state = reduce(
      joinedState(),
      { type: "hub/bid-rejected", event: makeBidRejected(), at: AT },
      { type: "rejection/dismissed", at: AT },
    );

    expect(state.rejection).toBeNull();
  });
});

describe("hub/outbid", () => {
  it("is stored until dismissed", () => {
    const outbid = reduce(joinedState(), {
      type: "hub/outbid",
      event: makeOutbid(),
      at: AT,
    });
    const dismissed = reduce(outbid, { type: "outbid/dismissed", at: AT });

    expect(outbid.outbid).toMatchObject({ newLeaderName: "Bob" });
    expect(dismissed.outbid).toBeNull();
  });
});

describe("lifecycle events", () => {
  it("moves a scheduled auction to Live on AuctionStarted", () => {
    const state = reduce(
      joinedState(makeAuctionDetail({ status: "Scheduled" })),
      {
        type: "hub/auction-started",
        event: makeAuctionStarted({ currentPrice: 500, minimumNextBid: 550 }),
        at: AT,
      },
    );

    expect(state.auction).toMatchObject({
      status: "Live",
      currentPrice: 500,
      minimumNextBid: 550,
    });
  });

  it("records the result on AuctionEnded", () => {
    const state = reduce(joinedState(), {
      type: "hub/auction-ended",
      event: makeAuctionEnded({ finalPrice: 3_000, bidCount: 9 }),
      at: AT,
    });

    expect(state.auction).toMatchObject({
      status: "Ended",
      currentPrice: 3_000,
      bidCount: 9,
    });
    expect(state.ended).toMatchObject({ winnerName: "Bob" });
  });

  it("marks the auction cancelled", () => {
    const state = reduce(joinedState(), {
      type: "hub/auction-cancelled",
      event: { auctionId: AUCTION_ID, title: "Vintage daktilo" },
      at: AT,
    });

    expect(state.auction?.status).toBe("Cancelled");
  });

  it("tracks the viewer count only for its own auction", () => {
    const mine = reduce(joinedState(), {
      type: "hub/viewer-count",
      event: { auctionId: AUCTION_ID, viewerCount: 12 },
      at: AT,
    });
    const other = reduce(mine, {
      type: "hub/viewer-count",
      event: { auctionId: "other-auction", viewerCount: 99 },
      at: AT,
    });

    expect(mine.viewerCount).toBe(12);
    expect(other.viewerCount).toBe(12);
  });
});

describe("connection", () => {
  it("clears the last error once connected again", () => {
    const state = reduce(
      createInitialState(AUCTION_ID),
      { type: "connection/failed", message: "boom", at: AT },
      { type: "connection/changed", status: "connected", at: AT },
    );

    expect(state.connection).toBe("connected");
    expect(state.connectionError).toBeNull();
  });

  it("reports a failed start as an error with its message", () => {
    const state = reduce(createInitialState(AUCTION_ID), {
      type: "connection/failed",
      message: "negotiate 404",
      at: AT,
    });

    expect(state).toMatchObject({
      connection: "error",
      connectionError: "negotiate 404",
    });
  });

  it("resets everything when the room changes", () => {
    const state = reduce(joinedState(), {
      type: "room/reset",
      auctionId: "another-auction",
      at: AT,
    });

    expect(state).toEqual(createInitialState("another-auction"));
  });
});

describe("hub log", () => {
  it("records traffic newest first, tagged by direction", () => {
    const state = reduce(
      createInitialState(AUCTION_ID),
      { type: "connection/changed", status: "connected", at: AT },
      { type: "room/joined", auction: makeAuctionDetail(), at: AT },
      { type: "bid/submitted", amount: 1_200, at: AT },
      { type: "hub/bid-placed", event: makeBidPlaced(), at: AT },
    );

    expect(
      state.log.map(({ channel, name }) => `${channel}:${name}`),
    ).toEqual([
      "event:BidPlaced",
      "invocation:PlaceBid",
      "invocation:JoinAuction",
      "connection:connected",
    ]);
  });

  it("is capped and gives every entry a distinct id", () => {
    const actions: AuctionRoomAction[] = Array.from(
      { length: MAX_LOG + 10 },
      (_, index) => ({
        type: "hub/bid-placed",
        event: makeBidPlaced({ bidId: `bid-${index}` }),
        at: AT,
      }),
    );

    const state = reduce(joinedState(), ...actions);
    const ids = new Set(state.log.map((entry) => entry.id));

    expect(state.log).toHaveLength(MAX_LOG);
    expect(ids.size).toBe(MAX_LOG);
  });
});

describe("selectors", () => {
  it("knows when bidding is open", () => {
    const connected = reduce(joinedState(), {
      type: "connection/changed",
      status: "connected",
      at: AT,
    });

    expect(isLive(connected)).toBe(true);
    expect(canPlaceBid(connected)).toBe(true);
  });

  it("refuses bidding while the socket is down", () => {
    const dropped = reduce(joinedState(), {
      type: "connection/changed",
      status: "reconnecting",
      at: AT,
    });

    expect(canPlaceBid(dropped)).toBe(false);
  });

  it("refuses bidding when the auction is not live", () => {
    const ended = reduce(
      joinedState(makeAuctionDetail({ status: "Ended" })),
      { type: "connection/changed", status: "connected", at: AT },
    );

    expect(canPlaceBid(ended)).toBe(false);
  });

  it("recognises the leading bidder", () => {
    const state = joinedState();

    expect(isLeading(state, "u-alice")).toBe(true);
    expect(isLeading(state, "u-bob")).toBe(false);
  });

  it("counts down on the server's clock, not the device's", () => {
    const skewed = reduce(joinedState(), {
      type: "hub/bid-placed",
      // The device is 30s behind the server.
      event: makeBidPlaced({ createdAt: "2026-01-01T11:30:30.000Z" }),
      at: Date.parse("2026-01-01T11:30:00.000Z"),
    });

    expect(skewed.serverOffsetMs).toBe(-30_000);
    expect(remainingMs(skewed, Date.parse("2026-01-01T11:59:00.000Z"))).toBe(
      30_000,
    );
  });

  it("never reports negative time", () => {
    const state = joinedState();

    expect(remainingMs(state, Date.parse(ENDS_AT) + 5_000)).toBe(0);
  });

  it("has nothing to count down before the snapshot arrives", () => {
    expect(remainingMs(createInitialState(AUCTION_ID), AT)).toBeNull();
  });
});
