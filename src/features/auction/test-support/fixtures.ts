import type { AuctionDetail, Bid } from "../model/auction";
import type {
  AuctionEndedEvent,
  AuctionStartedEvent,
  BidPlacedEvent,
  BidRejectedEvent,
  OutbidEvent,
} from "../model/hub-events";

export const AUCTION_ID = "aaaaaaaa-0000-0000-0000-000000000001";
export const ENDS_AT = "2026-01-01T12:00:00.000Z";

export function makeBid(overrides: Partial<Bid> = {}): Bid {
  return {
    id: "bid-1",
    auctionId: AUCTION_ID,
    amount: 1_000,
    bidderId: "u-alice",
    bidderName: "Alice",
    createdAt: "2026-01-01T11:00:00.000Z",
    ...overrides,
  };
}

export function makeAuctionDetail(
  overrides: Partial<AuctionDetail> = {},
): AuctionDetail {
  return {
    id: AUCTION_ID,
    productId: "product-1",
    title: "Vintage daktilo",
    imageUrl: null,
    description: "1960'lardan çalışır durumda",
    startingPrice: 500,
    currentPrice: 1_000,
    minimumIncrement: 50,
    minimumNextBid: 1_050,
    bidCount: 1,
    highestBidderId: "u-alice",
    highestBidderName: "Alice",
    status: "Live",
    startsAt: "2026-01-01T11:00:00.000Z",
    endsAt: ENDS_AT,
    recentBids: [makeBid()],
    ...overrides,
  };
}

export function makeBidPlaced(
  overrides: Partial<BidPlacedEvent> = {},
): BidPlacedEvent {
  return {
    auctionId: AUCTION_ID,
    bidId: "bid-2",
    amount: 1_100,
    minimumNextBid: 1_150,
    bidderId: "u-bob",
    bidderName: "Bob",
    bidCount: 2,
    createdAt: "2026-01-01T11:30:00.000Z",
    endsAt: ENDS_AT,
    ...overrides,
  };
}

export function makeBidRejected(
  overrides: Partial<BidRejectedEvent> = {},
): BidRejectedEvent {
  return {
    auctionId: AUCTION_ID,
    reason: "Teklif çok düşük",
    errorCode: "bid_too_low",
    minimumRequired: 1_150,
    ...overrides,
  };
}

export function makeOutbid(overrides: Partial<OutbidEvent> = {}): OutbidEvent {
  return {
    auctionId: AUCTION_ID,
    auctionTitle: "Vintage daktilo",
    yourBid: 1_000,
    newPrice: 1_100,
    newLeaderName: "Bob",
    minimumNextBid: 1_150,
    ...overrides,
  };
}

export function makeAuctionStarted(
  overrides: Partial<AuctionStartedEvent> = {},
): AuctionStartedEvent {
  return {
    auctionId: AUCTION_ID,
    title: "Vintage daktilo",
    currentPrice: 500,
    minimumNextBid: 550,
    startsAt: "2026-01-01T11:00:00.000Z",
    endsAt: ENDS_AT,
    ...overrides,
  };
}

export function makeAuctionEnded(
  overrides: Partial<AuctionEndedEvent> = {},
): AuctionEndedEvent {
  return {
    auctionId: AUCTION_ID,
    title: "Vintage daktilo",
    finalPrice: 1_100,
    winnerId: "u-bob",
    winnerName: "Bob",
    bidCount: 2,
    endedAt: "2026-01-01T12:00:00.000Z",
    ...overrides,
  };
}
