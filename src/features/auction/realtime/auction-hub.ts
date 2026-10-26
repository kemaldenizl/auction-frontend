import type { Bidder } from "@/features/bidder/model/bidder";

import type { AuctionDetail } from "../model/auction";
import type {
  AuctionCancelledEvent,
  AuctionEndedEvent,
  AuctionStartedEvent,
  BidPlacedEvent,
  BidRejectedEvent,
  OutbidEvent,
  ViewerCountChangedEvent,
} from "../model/hub-events";

/** Server -> client messages, keyed by the exact hub method name. */
export interface HubEventMap {
  BidPlaced: BidPlacedEvent;
  BidRejected: BidRejectedEvent;
  Outbid: OutbidEvent;
  AuctionStarted: AuctionStartedEvent;
  AuctionEnded: AuctionEndedEvent;
  AuctionCancelled: AuctionCancelledEvent;
  ViewerCountChanged: ViewerCountChangedEvent;
}

export type HubEventName = keyof HubEventMap;

/** Client -> server methods. */
export const HUB_METHODS = {
  joinAuction: "JoinAuction",
  placeBid: "PlaceBid",
} as const;

/**
 * The transport seam.
 *
 * `useAuctionRoom` talks to this interface, never to `HubConnection` directly,
 * which keeps the SignalR client out of the hook's tests and makes the
 * reconnect behaviour something a fake can reproduce.
 */
export interface AuctionHub {
  start(): Promise<void>;
  stop(): Promise<void>;
  /** Joins the group **and** returns the current snapshot in one round trip. */
  join(auctionId: string): Promise<AuctionDetail>;
  /** Fire-and-forget: the outcome arrives as `BidPlaced` or `BidRejected`. */
  placeBid(auctionId: string, amount: number): Promise<void>;
  isConnected(): boolean;
  on<K extends HubEventName>(
    event: K,
    handler: (payload: HubEventMap[K]) => void,
  ): void;
  onReconnecting(handler: () => void): void;
  onReconnected(handler: () => void): void;
  onClose(handler: () => void): void;
}

export type AuctionHubFactory = (bidder: Bidder) => AuctionHub;

/** Thrown when a bid is attempted before the connection is usable. */
export class HubNotReadyError extends Error {
  constructor() {
    super("Bağlantı hazır değil, lütfen tekrar deneyin.");
    this.name = "HubNotReadyError";
  }
}
