import {
  createHttpClient,
  type HttpClient,
  type PagedResult,
} from "@/shared/api";
import { env } from "@/shared/config/env";

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

/**
 * Auction service, reached through the gateway at `/api/auctions`.
 *
 * REST and the hub share the same business rules and both broadcast the same
 * live events — the only difference is how you learn the outcome. Inside a live
 * room prefer the hub (the socket is already open); keep REST for the fallback
 * path and for one-off screens where a synchronous answer is easier.
 */
export function createAuctionApi(http: HttpClient) {
  return {
    listAuctions: (query: AuctionListQuery = {}) =>
      http.get<PagedResult<AuctionSummary>>("/api/auctions", {
        query: { ...query },
      }),

    getAuction: (id: string) =>
      http.get<AuctionDetail>(`/api/auctions/${id}`),

    listBids: (id: string, take = 50) =>
      http.get<Bid[]>(`/api/auctions/${id}/bids`, { query: { take } }),

    createAuction: (draft: CreateAuctionDraft) =>
      http.post<AuctionDetail>("/api/auctions", draft),

    /** Synchronous alternative to the hub's `PlaceBid`; throws `ApiError` on 409. */
    placeBid: (id: string, draft: PlaceBidDraft) =>
      http.post<PlaceBidResponse>(`/api/auctions/${id}/bids`, draft),

    startAuction: (id: string) =>
      http.post<AuctionDetail>(`/api/auctions/${id}/start`),

    cancelAuction: (id: string) =>
      http.post<AuctionDetail>(`/api/auctions/${id}/cancel`),
  };
}

export type AuctionApi = ReturnType<typeof createAuctionApi>;

export const auctionApi = createAuctionApi(createHttpClient(env.apiUrl));
