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
  page?: number;
  pageSize?: number;
}

export interface CreateAuctionDraft {
  productId: string;
  minimumIncrement: number;
  durationMinutes: number;
  startingPrice?: number;
  startsAt?: string;
}

export interface PlaceBidDraft {
  amount: number;
  bidderId: string;
  bidderName: string;
}

export function isAuctionStatus(value: string): value is AuctionStatus {
  return (AUCTION_STATUSES as readonly string[]).includes(value);
}
