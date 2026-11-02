export type AuctionStatus = "Scheduled" | "Live" | "Ended" | "Cancelled";

export const AUCTION_STATUSES: readonly AuctionStatus[] = [
  "Scheduled",
  "Live",
  "Ended",
  "Cancelled",
];

export interface Bid {
  id: string;
  auctionId: string;
  amount: number;
  bidderId: string;
  bidderName: string;
  createdAt: string;
}

export interface AuctionSummary {
  id: string;
  productId: string;
  title: string;
  imageUrl: string | null;
  startingPrice: number;
  currentPrice: number;
  minimumIncrement: number;
  /**
   * The floor for the next bid, computed by the server. Never derive this on
   * the client — `currentPrice + minimumIncrement` is not always the rule.
   */
  minimumNextBid: number;
  bidCount: number;
  highestBidderName: string | null;
  status: AuctionStatus;
  startsAt: string;
  endsAt: string;
}

export interface AuctionDetail extends AuctionSummary {
  description: string | null;
  highestBidderId: string | null;
  recentBids: Bid[];
}

export interface AuctionListQuery {
  status?: AuctionStatus;
  /** Matches the auction title. */
  search?: string;
  productId?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateAuctionDraft {
  productId: string;
  /** Falls back to the product's catalogue price. */
  startingPrice?: number;
  /** Defaults to 100. */
  minimumIncrement?: number;
  /** Omit to start immediately; a past timestamp is rejected. */
  startsAt?: string;
  /** Defaults to 60, at most 10080 (7 days). */
  durationMinutes?: number;
}

/**
 * Only the amount travels. The bidder is read from the access token, so a
 * `bidderId` in the body would be ignored — nobody can bid as someone else.
 */
export interface PlaceBidDraft {
  amount: number;
}

export function isAuctionStatus(value: string): value is AuctionStatus {
  return (AUCTION_STATUSES as readonly string[]).includes(value);
}
