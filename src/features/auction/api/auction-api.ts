import { apiHttp } from "@/features/auth/lib/api-http";
import type { HttpClient, PagedResult } from "@/shared/api";

import type {
  AuctionDetail,
  AuctionListQuery,
  AuctionSummary,
  Bid,
  CreateAuctionDraft,
  PlaceBidDraft,
} from "../model/auction";

export interface PlaceBidResponse {
  bid: Bid;
  auction: AuctionSummary;
}

/** The history endpoint caps `take` at 200. */
export const MAX_BID_HISTORY = 200;

/**
 * Auction service, reached through the gateway at `/api/auctions`.
 *
 * Reads are public; bidding needs a session and the management calls need
 * `auctions.manage`. REST and the hub share the same rules and publish the
 * same events — the only difference is how the outcome reaches you. Inside a
 * live room prefer the hub; REST is the fallback when the socket is down and
 * the easier path where a synchronous answer is wanted.
 */
export function createAuctionApi(http: HttpClient) {
  return {
    listAuctions: (query: AuctionListQuery = {}, signal?: AbortSignal) =>
      http.get<PagedResult<AuctionSummary>>("/api/auctions", {
        query: { ...query },
        signal,
      }),

    getAuction: (id: string, signal?: AbortSignal) =>
      http.get<AuctionDetail>(`/api/auctions/${id}`, { signal }),

    listBids: (id: string, take = 50, signal?: AbortSignal) =>
      http.get<Bid[]>(`/api/auctions/${id}/bids`, {
        query: { take: Math.min(take, MAX_BID_HISTORY) },
        signal,
      }),

    createAuction: (draft: CreateAuctionDraft) =>
      http.post<AuctionDetail>("/api/auctions", draft),

    /** Synchronous alternative to the hub's `PlaceBid`; throws `ApiError` on 409. */
    placeBid: (id: string, draft: PlaceBidDraft) =>
      http.post<PlaceBidResponse>(`/api/auctions/${id}/bids`, draft),

    /** Idempotent: pulls a scheduled auction live without waiting for its time. */
    startAuction: (id: string) =>
      http.post<AuctionDetail>(`/api/auctions/${id}/start`),

    cancelAuction: (id: string) =>
      http.post<AuctionDetail>(`/api/auctions/${id}/cancel`),
  };
}

export type AuctionApi = ReturnType<typeof createAuctionApi>;

export const auctionApi = createAuctionApi(apiHttp);
