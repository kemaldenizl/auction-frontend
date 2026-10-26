import Link from "next/link";

import type { PagedResult } from "@/shared/api";
import { cn } from "@/shared/lib/cn";

const STEP = cn(
  "rounded-lg border border-line px-3 py-1.5 text-sm font-medium transition-colors",
  "hover:bg-surface-muted",
);

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

  return (
    <nav aria-label="Sayfalama" className="flex items-center justify-between">
      {result.hasPrevious ? (
        <Link href={hrefForPage(result.page - 1)} className={STEP}>
          ← Önceki
        </Link>
      ) : (
        <span className={cn(STEP, "opacity-40")}>← Önceki</span>
      )}

      <span className="text-sm text-subtle tabular">
        {result.page} / {result.totalPages}
      </span>

      {result.hasNext ? (
        <Link href={hrefForPage(result.page + 1)} className={STEP}>
          Sonraki →
        </Link>
      ) : (
        <span className={cn(STEP, "opacity-40")}>Sonraki →</span>
      )}
    </nav>
  );
}
