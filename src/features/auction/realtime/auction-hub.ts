import { UserFacingError } from "@/shared/api";

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
  leaveAuction: "LeaveAuction",
  placeBid: "PlaceBid",
  whoAmI: "WhoAmI",
} as const;

/** The connection's identity as the server read it from the access token. */
export interface HubIdentity {
  id: string;
  name: string;
}

/**
 * The transport seam.
 *
 * `useAuctionRoom` talks to this interface, never to `HubConnection` directly,
 * which keeps the SignalR client out of the hook's tests and makes reconnects
 * something a fake can reproduce.
 */
export interface AuctionHub {
  start(): Promise<void>;
  stop(): Promise<void>;
  /** Joins the group **and** returns the current snapshot in one round trip. */
  join(auctionId: string): Promise<AuctionDetail>;
  leave(auctionId: string): Promise<void>;
  /** Fire-and-forget: the outcome arrives as `BidPlaced` or `BidRejected`. */
  placeBid(auctionId: string, amount: number): Promise<void>;
  whoAmI(): Promise<HubIdentity>;
  isConnected(): boolean;
  on<K extends HubEventName>(
    event: K,
    handler: (payload: HubEventMap[K]) => void,
  ): void;
  onReconnecting(handler: () => void): void;
  onReconnected(handler: () => void): void;
  onClose(handler: () => void): void;
}

/** Takes no identity: the hub authenticates from the access token. */
export type AuctionHubFactory = () => AuctionHub;

/**
 * Thrown when a bid is attempted before the connection is usable. Its message
 * is written for the user, so the form shows it as-is.
 */
export class HubNotReadyError extends UserFacingError {
  constructor() {
    super("Bağlantı henüz hazır değil. Lütfen birkaç saniye sonra tekrar deneyin.");
    this.name = "HubNotReadyError";
  }
}
