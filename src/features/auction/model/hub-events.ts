/**
 * The SignalR contract, server -> client. These payloads are the source of
 * truth for price, minimum next bid and bid count: write them into state as
 * they arrive rather than recomputing anything locally.
 */

export interface BidPlacedEvent {
  auctionId: string;
  bidId: string;
  amount: number;
  minimumNextBid: number;
  bidderId: string;
  bidderName: string;
  bidCount: number;
  createdAt: string;
  endsAt: string;
}

/** Sent only to the bidder who just lost the lead. */
export interface OutbidEvent {
  auctionId: string;
  auctionTitle: string;
  yourBid: number;
  newPrice: number;
  newLeaderName: string;
  minimumNextBid: number;
}

export interface AuctionStartedEvent {
  auctionId: string;
  title: string;
  currentPrice: number;
  minimumNextBid: number;
  startsAt: string;
  endsAt: string;
}

export interface AuctionEndedEvent {
  auctionId: string;
  title: string;
  finalPrice: number;
  winnerId: string | null;
  winnerName: string | null;
  bidCount: number;
  endedAt: string;
}

export interface AuctionCancelledEvent {
  auctionId: string;
  title: string;
}

export interface ViewerCountChangedEvent {
  auctionId: string;
  viewerCount: number;
}

/** Sent only to the connection whose bid was refused. */
export interface BidRejectedEvent {
  auctionId: string;
  reason: string;
  errorCode: BidErrorCode;
  minimumRequired: number | null;
}

export type BidErrorCode =
  | "bid_too_low"
  | "already_highest_bidder"
  | "auction_not_started"
  | "auction_ended"
  | "auction_cancelled"
  | "invalid_amount"
  | "missing_bidder"
  | "not_found";
