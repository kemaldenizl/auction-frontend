import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import type { PagedResult } from "@/shared/api";
import { cn } from "@/shared/lib/cn";

import { buttonClassName } from "./button";

/**
 * Link-based pagination: the page number lives in the URL, so a server
 * component re-renders with fresh data and the result stays shareable.
 */
export function Pagination<T>({
  result,
  hrefForPage,
}: {
  result: Pick<PagedResult<T>, "page" | "totalPages" | "hasPrevious" | "hasNext">;
  hrefForPage: (page: number) => string;
}) {
  if (result.totalPages <= 1) return null;

  const step = buttonClassName({ variant: "secondary", size: "sm" });
  const disabled = cn(step, "pointer-events-none opacity-40");

  return (
    <nav aria-label="Sayfalama" className="flex items-center justify-between">
      {result.hasPrevious ? (
        <Link href={hrefForPage(result.page - 1)} className={step}>
          <ChevronLeft /> Önceki
        </Link>
      ) : (
        <span className={disabled}>
          <ChevronLeft /> Önceki
        </span>
      )}

      <span className="text-sm text-subtle tabular">
        {result.page} / {result.totalPages}
      </span>

      {result.hasNext ? (
        <Link href={hrefForPage(result.page + 1)} className={step}>
          Sonraki <ChevronRight />
        </Link>
      ) : (
        <span className={disabled}>
          Sonraki <ChevronRight />
        </span>
      )}
    </nav>
  );
}
