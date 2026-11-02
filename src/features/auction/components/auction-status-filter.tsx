import { ChipLink } from "@/shared/ui";

import { AUCTION_STATUSES, type AuctionStatus } from "../model/auction";
import { auctionsHref } from "./auction-board";
import { auctionStatusLabel } from "./auction-status-badge";

export function AuctionStatusFilter({
  selected,
  search,
  productId,
}: {
  selected?: AuctionStatus;
  search?: string;
  productId?: string;
}) {
  const options: { label: string; status?: AuctionStatus }[] = [
    { label: "Tümü" },
    ...AUCTION_STATUSES.map((status) => ({
      label: auctionStatusLabel(status),
      status,
    })),
  ];

  return (
    <nav aria-label="Duruma göre filtrele" className="flex flex-wrap gap-2">
      {options.map((option) => (
        <ChipLink
          key={option.label}
          // Keeps the active search when switching status.
          href={auctionsHref({ status: option.status, search, productId })}
          active={option.status === selected}
        >
          {option.label}
        </ChipLink>
      ))}
    </nav>
  );
}
