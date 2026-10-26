import { attempt } from "@/shared/api";
import { ApiErrorPanel, EmptyState, Pagination, Skeleton } from "@/shared/ui";

import { auctionApi } from "../api/auction-api";
import type { AuctionStatus } from "../model/auction";
import { AuctionCard } from "./auction-card";

const PAGE_SIZE = 12;

function boardHref(page: number, status?: AuctionStatus): string {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/auctions?${query}` : "/auctions";
}

/**
 * Server-rendered list. It is a snapshot, not a live view — the realtime part
 * starts when you open a room, where `JoinAuction` hands over the current
 * state and the hub keeps it current.
 */
export async function AuctionBoard({
  status,
  page = 1,
  pageSize = PAGE_SIZE,
  paginated = true,
}: {
  status?: AuctionStatus;
  page?: number;
  pageSize?: number;
  paginated?: boolean;
}) {
  const result = await attempt(
    auctionApi.listAuctions({ status, page, pageSize }),
  );

  if (!result.ok) {
    return <ApiErrorPanel problem={result.error.problem} />;
  }

  if (result.data.items.length === 0) {
    return (
      <EmptyState
        title="Açık arttırma yok"
        description="Bir ürün sayfasından yeni açık arttırma oluşturabilirsiniz."
      />
    );
  }

  return (
    <div className="space-y-6">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.data.items.map((auction) => (
          <li key={auction.id}>
            <AuctionCard auction={auction} />
          </li>
        ))}
      </ul>

      {paginated && (
        <Pagination
          result={result.data}
          hrefForPage={(target) => boardHref(target, status)}
        />
      )}
    </div>
  );
}

export function AuctionBoardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-72" />
      ))}
    </div>
  );
}
