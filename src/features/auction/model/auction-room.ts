import { formatMoney } from "@/shared/lib/format";

import type { AuctionDetail, Bid } from "./auction";
import type {
  AuctionCancelledEvent,
  AuctionEndedEvent,
  AuctionStartedEvent,
  BidPlacedEvent,
  BidRejectedEvent,
  OutbidEvent,
  ViewerCountChangedEvent,
} from "./hub-events";

/** How many bids the live feed keeps. The server only sends recent ones anyway. */
export const MAX_FEED = 50;
/** How many hub events the inspector panel keeps. */
export const MAX_LOG = 60;

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";

export type LogChannel = "event" | "connection" | "invocation";

export interface HubLogEntry {
  id: number;
  /** Local wall clock, supplied by the caller so the reducer stays pure. */
  at: number;
  channel: LogChannel;
  name: string;
  summary?: string;
}

export interface AuctionRoomState {
  readonly auctionId: string;
  auction: AuctionDetail | null;
  bids: Bid[];
  viewerCount: number;
  connection: ConnectionStatus;
  connectionError: string | null;
  rejection: BidRejectedEvent | null;
  outbid: OutbidEvent | null;
  ended: AuctionEndedEvent | null;
  /**
   * Local clock minus server clock, in milliseconds. Added to `endsAt` before
   * counting down so a skewed device clock does not shift the timer. It also
   * absorbs one network hop, which is well under a second.
   */
  serverOffsetMs: number;
  log: HubLogEntry[];
  nextLogId: number;
}

interface ActionAt {
  /** `Date.now()` at dispatch time. Passed in to keep the reducer pure. */
  at: number;
}

export type AuctionRoomAction =
  | ({ type: "room/reset"; auctionId: string } & ActionAt)
  | ({ type: "room/joined"; auction: AuctionDetail } & ActionAt)
  | ({ type: "connection/changed"; status: ConnectionStatus } & ActionAt)
  | ({ type: "connection/failed"; message: string } & ActionAt)
  | ({ type: "bid/submitted"; amount: number } & ActionAt)
  | ({ type: "hub/bid-placed"; event: BidPlacedEvent } & ActionAt)
  | ({ type: "hub/bid-rejected"; event: BidRejectedEvent } & ActionAt)
  | ({ type: "hub/outbid"; event: OutbidEvent } & ActionAt)
  | ({ type: "hub/auction-started"; event: AuctionStartedEvent } & ActionAt)
  | ({ type: "hub/auction-ended"; event: AuctionEndedEvent } & ActionAt)
  | ({ type: "hub/auction-cancelled"; event: AuctionCancelledEvent } & ActionAt)
  | ({ type: "hub/viewer-count"; event: ViewerCountChangedEvent } & ActionAt)
  | ({ type: "outbid/dismissed" } & ActionAt)
  | ({ type: "rejection/dismissed" } & ActionAt);

export function createInitialState(auctionId: string): AuctionRoomState {
  return {
    auctionId,
    auction: null,
    bids: [],
    viewerCount: 0,
    connection: "connecting",
    connectionError: null,
    rejection: null,
    outbid: null,
    ended: null,
    serverOffsetMs: 0,
    log: [],
    nextLogId: 0,
  };
}

function appendLog(
  state: AuctionRoomState,
  entry: Omit<HubLogEntry, "id">,
): AuctionRoomState {
  return {
    ...state,
    log: [{ ...entry, id: state.nextLogId }, ...state.log].slice(0, MAX_LOG),
    nextLogId: state.nextLogId + 1,
  };
}

/** Events for another auction can reach a shared connection — ignore them. */
function isForRoom(
  state: AuctionRoomState,
  event: { auctionId: string },
): boolean {
  return event.auctionId === state.auctionId;
}

/**
 * Your own bid comes back as `BidPlaced` too, and a reconnect replays recent
 * bids, so the feed is keyed on `bidId` to stay free of duplicates.
 */
function addBid(bids: Bid[], event: BidPlacedEvent): Bid[] {
  if (bids.some((bid) => bid.id === event.bidId)) return bids;

  const bid: Bid = {
    id: event.bidId,
    auctionId: event.auctionId,
    amount: event.amount,
    bidderId: event.bidderId,
    bidderName: event.bidderName,
    createdAt: event.createdAt,
  };

  return [bid, ...bids].slice(0, MAX_FEED);
}

function measureOffset(
  at: number,
  serverTimestamp: string,
  fallback: number,
): number {
  const serverTime = Date.parse(serverTimestamp);
  return Number.isNaN(serverTime) ? fallback : at - serverTime;
}

export function auctionRoomReducer(
  state: AuctionRoomState,
  action: AuctionRoomAction,
): AuctionRoomState {
  switch (action.type) {
    case "room/reset":
      return createInitialState(action.auctionId);

    case "connection/changed":
      return appendLog(
        {
          ...state,
          connection: action.status,
          connectionError:
            action.status === "connected" ? null : state.connectionError,
        },
        { at: action.at, channel: "connection", name: action.status },
      );

    case "connection/failed":
      return appendLog(
        { ...state, connection: "error", connectionError: action.message },
        {
          at: action.at,
          channel: "connection",
          name: "error",
          summary: action.message,
        },
      );

    // `JoinAuction` returns the current snapshot, so there is no separate REST
    // read and no window in which a bid can slip through unseen.
    case "room/joined":
      return appendLog(
        {
          ...state,
          auction: action.auction,
          bids: action.auction.recentBids,
          ended: null,
          rejection: null,
        },
        {
          at: action.at,
          channel: "invocation",
          name: "JoinAuction",
          summary: `${action.auction.bidCount} teklif · ${formatMoney(
            action.auction.currentPrice,
          )}`,
        },
      );

    // `PlaceBid` resolving does not mean "accepted" — the answer arrives as a
    // `BidPlaced` or `BidRejected` event.
    case "bid/submitted":
      return appendLog(
        { ...state, rejection: null },
        {
          at: action.at,
          channel: "invocation",
          name: "PlaceBid",
          summary: formatMoney(action.amount),
        },
      );

    case "hub/bid-placed": {
      if (!isForRoom(state, action.event)) return state;
      const event = action.event;

      return appendLog(
        {
          ...state,
          auction: state.auction && {
            ...state.auction,
            currentPrice: event.amount,
            minimumNextBid: event.minimumNextBid,
            bidCount: event.bidCount,
            highestBidderId: event.bidderId,
            highestBidderName: event.bidderName,
            endsAt: event.endsAt,
          },
          bids: addBid(state.bids, event),
          // A newer bid makes any earlier rejection message stale.
          rejection: null,
          serverOffsetMs: measureOffset(
            action.at,
            event.createdAt,
            state.serverOffsetMs,
          ),
        },
        {
          at: action.at,
          channel: "event",
          name: "BidPlaced",
          summary: `${formatMoney(event.amount)} · ${event.bidderName}`,
        },
      );
    }

    case "hub/bid-rejected": {
      if (!isForRoom(state, action.event)) return state;

      return appendLog(
        { ...state, rejection: action.event },
        {
          at: action.at,
          channel: "event",
          name: "BidRejected",
          summary: action.event.errorCode,
        },
      );
    }

    case "hub/outbid": {
      if (!isForRoom(state, action.event)) return state;

      return appendLog(
        { ...state, outbid: action.event },
        {
          at: action.at,
          channel: "event",
          name: "Outbid",
          summary: `${formatMoney(action.event.yourBid)} → ${formatMoney(
            action.event.newPrice,
          )}`,
        },
      );
    }

    case "hub/auction-started": {
      if (!isForRoom(state, action.event)) return state;
      const event = action.event;

      return appendLog(
        {
          ...state,
          ended: null,
          auction: state.auction && {
            ...state.auction,
            status: "Live",
            currentPrice: event.currentPrice,
            minimumNextBid: event.minimumNextBid,
            startsAt: event.startsAt,
            endsAt: event.endsAt,
          },
        },
        { at: action.at, channel: "event", name: "AuctionStarted" },
      );
    }

    case "hub/auction-ended": {
      if (!isForRoom(state, action.event)) return state;
      const event = action.event;

      return appendLog(
        {
          ...state,
          ended: event,
          auction: state.auction && {
            ...state.auction,
            status: "Ended",
            currentPrice: event.finalPrice,
            bidCount: event.bidCount,
          },
          serverOffsetMs: measureOffset(
            action.at,
            event.endedAt,
            state.serverOffsetMs,
          ),
        },
        {
          at: action.at,
          channel: "event",
          name: "AuctionEnded",
          summary: event.winnerName ?? "teklif yok",
        },
      );
    }

    case "hub/auction-cancelled": {
      if (!isForRoom(state, action.event)) return state;

      return appendLog(
        {
          ...state,
          auction: state.auction && { ...state.auction, status: "Cancelled" },
        },
        { at: action.at, channel: "event", name: "AuctionCancelled" },
      );
    }

    case "hub/viewer-count": {
      if (!isForRoom(state, action.event)) return state;

      return { ...state, viewerCount: action.event.viewerCount };
    }

    case "outbid/dismissed":
      return { ...state, outbid: null };

    case "rejection/dismissed":
      return { ...state, rejection: null };
  }
}

// ---- selectors ----

export function isLive(state: AuctionRoomState): boolean {
  return state.auction?.status === "Live";
}

export function isLeading(
  state: AuctionRoomState,
  bidderId: string,
): boolean {
  return (
    state.auction !== null && state.auction.highestBidderId === bidderId
  );
}

export function canPlaceBid(state: AuctionRoomState): boolean {
  return isLive(state) && state.connection === "connected";
}

/** Milliseconds left on the server's clock, or `null` before the snapshot. */
export function remainingMs(
  state: AuctionRoomState,
  now: number,
): number | null {
  if (!state.auction) return null;

  const endsAt = Date.parse(state.auction.endsAt);
  if (Number.isNaN(endsAt)) return null;

  return Math.max(0, endsAt + state.serverOffsetMs - now);
}
