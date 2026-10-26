import Link from "next/link";

import { cn } from "@/shared/lib/cn";

import { AUCTION_STATUSES, type AuctionStatus } from "../model/auction";
import { auctionStatusLabel } from "./auction-status-badge";

const CHIP =
  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors";

export function AuctionStatusFilter({
  selected,
}: {
  selected?: AuctionStatus;
}) {
  const options: { label: string; status?: AuctionStatus }[] = [
    { label: "Tümü" },
    ...AUCTION_STATUSES.map((status) => ({
      label: auctionStatusLabel(status),
      status,
    })),
  ];

  return (
    <nav aria-label="Durum filtresi" className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.status === selected;

        return (
          <Link
            key={option.label}
            href={option.status ? `/auctions?status=${option.status}` : "/auctions"}
            aria-current={active ? "page" : undefined}
            className={cn(
              CHIP,
              active
                ? "border-brand bg-brand-soft text-brand"
                : "border-line text-muted hover:bg-surface-muted",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}
