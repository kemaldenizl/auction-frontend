import Link from "next/link";

import { cn } from "@/shared/lib/cn";

const CHIP = "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors";

/** Link-based filter: the selection lives in the URL and stays shareable. */
export function CategoryFilter({
  categories,
  selected,
}: {
  categories: string[];
  selected?: string;
}) {
  const options = [{ label: "Tümü", value: undefined }, ...categories.map((category) => ({ label: category, value: category }))];

  return (
    <nav aria-label="Kategori filtresi" className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === selected;

        return (
          <Link
            key={option.label}
            href={option.value ? `/products?category=${encodeURIComponent(option.value)}` : "/products"}
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
