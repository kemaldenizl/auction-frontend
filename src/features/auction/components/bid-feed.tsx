import { cn } from "@/shared/lib/cn";
import { formatClock, formatMoneyPrecise } from "@/shared/lib/format";
import { Card, CardBody, CardHeader, EmptyState } from "@/shared/ui";

import type { Bid } from "../model/auction";

export function BidFeed({
  bids,
  bidderId,
}: {
  bids: Bid[];
  /** Used only to mark your own bids in the list. */
  bidderId: string;
}) {
  return (
    <Card>
      <CardHeader
        title="Teklif akışı"
        description={`${bids.length} kayıt · en yeni üstte`}
      />
      <CardBody className="p-0">
        {bids.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="Henüz teklif yok"
              description="İlk teklifi veren siz olun."
            />
          </div>
        ) : (
          <ol className="divide-y divide-line">
            {bids.map((bid, index) => {
              const mine = bid.bidderId === bidderId;

              return (
                <li
                  key={bid.id}
                  className={cn(
                    "flex items-center justify-between gap-3 px-4 py-2.5 text-sm",
                    index === 0 && "animate-price-flash",
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-semibold tabular text-fg">
                      {formatMoneyPrecise(bid.amount)}
                    </p>
                    <p className="truncate text-xs text-subtle">
                      {bid.bidderName}
                      {mine && " (siz)"}
                    </p>
                  </div>
                  <time
                    dateTime={bid.createdAt}
                    className="shrink-0 text-xs tabular text-subtle"
                  >
                    {formatClock(bid.createdAt)}
                  </time>
                </li>
              );
            })}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}
