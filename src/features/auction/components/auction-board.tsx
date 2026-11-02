import { Gavel } from "lucide-react";
import type { ReactNode } from "react";

import { attempt } from "@/shared/api";
import {
  ApiErrorPanel,
  EmptyState,
  Pagination,
  SearchForm,
  Skeleton,
  stagger,
} from "@/shared/ui";

import { auctionApi } from "../api/auction-api";
import type { AuctionStatus } from "../model/auction";
import { AuctionCard } from "./auction-card";
import { AuctionStatusFilter } from "./auction-status-filter";

const PAGE_SIZE = 12;

export interface AuctionBoardQuery {
  status?: AuctionStatus;
  search?: string;
  productId?: string;
  page?: number;
}

export function auctionsHref({
  status,
  search,
  productId,
  page,
}: AuctionBoardQuery): string {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  if (productId) params.set("productId", productId);
  if (page && page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/auctions?${query}` : "/auctions";
}

const GRID = "grid gap-5 sm:grid-cols-2 lg:grid-cols-3";

/**
 * Server-rendered list — public, so it needs no token.
 *
 * It is a snapshot, not a live view: the realtime part starts when you open a
 * room. Live auctions always sort first, then the ones ending soonest.
 */
export async function AuctionBoard({
  status,
  search,
  productId,
  page = 1,
  pageSize = PAGE_SIZE,
  paginated = true,
  emptyTitle = "Açık artırma bulunamadı",
  emptyDescription = "Aramanızı ya da filtreyi değiştirmeyi deneyin.",
  hideWhenEmpty = false,
  heading,
}: AuctionBoardQuery & {
  pageSize?: number;
  paginated?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  /** For secondary sections that should simply disappear when empty. */
  hideWhenEmpty?: boolean;
  /** Rendered above the list, and only when there is a list to head. */
  heading?: ReactNode;
}) {
  const result = await attempt(
    auctionApi.listAuctions({ status, search, productId, page, pageSize }),
  );

  if (!result.ok) {
    return <ApiErrorPanel problem={result.error.problem} />;
  }

  if (result.data.items.length === 0) {
    if (hideWhenEmpty) return null;
    return (
      <EmptyState
        icon={<Gavel />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-8">
      {heading}
      <ul className={GRID}>
        {result.data.items.map((auction, index) => (
          <li key={auction.id}>
            <AuctionCard auction={auction} style={stagger(index)} />
          </li>
        ))}
      </ul>

      {paginated && (
        <Pagination
          result={result.data}
          hrefForPage={(target) =>
            auctionsHref({ status, search, productId, page: target })
          }
        />
      )}
    </div>
  );
}

export function AuctionFilters({
  status,
  search,
  productId,
}: AuctionBoardQuery) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <AuctionStatusFilter selected={status} search={search} productId={productId} />
      <SearchForm
        action="/auctions"
        label="Açık artırma ara"
        placeholder="Ne arıyorsunuz?"
        defaultValue={search}
        hidden={{ status, productId }}
      />
    </div>
  );
}

export function AuctionBoardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={GRID}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-card border border-line bg-surface">
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
