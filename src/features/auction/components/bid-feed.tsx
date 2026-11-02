import { Crown, History } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { formatClock, formatMoney, maskEmail } from "@/shared/lib/format";
import { Card, CardBody, CardHeader, EmptyState } from "@/shared/ui";

import type { Bid } from "../model/auction";

export function BidFeed({
  bids,
  viewerId,
}: {
  bids: Bid[];
  /** The signed-in bidder, used only to mark their own rows. */
  viewerId: string | null;
}) {
  return (
    <Card>
      <CardHeader
        icon={<History />}
        title="Teklif geçmişi"
        description={
          bids.length > 0 ? `${bids.length} teklif · en yenisi üstte` : undefined
        }
      />
      <CardBody className="p-0">
        {bids.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Henüz teklif yok"
              description="İlk teklifi veren siz olun."
            />
          </div>
        ) : (
          <ol className="divide-y divide-line">
            {bids.map((bid, index) => {
              const mine = viewerId !== null && bid.bidderId === viewerId;
              const leading = index === 0;
              const name = mine ? "Siz" : maskEmail(bid.bidderName);

              return (
                <li
                  // A fresh key per bid makes each new row slide in.
                  key={bid.id}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3 text-sm",
                    leading && "animate-slide-in bg-brand-soft/40",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold",
                      mine
                        ? "bg-gradient-brand text-white"
                        : "bg-surface-muted text-muted",
                    )}
                  >
                    {name[0]?.toLocaleUpperCase("tr-TR")}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 font-semibold tabular text-fg">
                      {formatMoney(bid.amount)}
                      {leading && (
                        <Crown aria-label="En yüksek teklif" className="size-3.5 text-warning" />
                      )}
                    </p>
                    <p className="truncate text-xs text-subtle">
                      {mine ? `${bid.bidderName} (siz)` : name}
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
