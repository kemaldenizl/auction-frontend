import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";

import { ChipLink, SearchForm } from "@/shared/ui";

import {
  PRODUCT_SORT_OPTIONS,
  type ProductListQuery,
  type ProductSortBy,
} from "../model/product";

export type ProductFilterState = Pick<
  ProductListQuery,
  "search" | "category" | "sortBy" | "descending" | "isActive"
>;

export function productsHref(
  filters: ProductFilterState & { page?: number },
): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.descending === false) params.set("descending", "false");
  if (filters.isActive !== undefined) {
    params.set("isActive", String(filters.isActive));
  }
  if (filters.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }

  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

const STATUS_OPTIONS = [
  { label: "Hepsi", value: undefined },
  { label: "Satışta", value: true },
  { label: "Satışta değil", value: false },
] as const;

/**
 * Every filter is a link or a GET form, so the whole state lives in the URL:
 * the list stays server-rendered and the result is shareable.
 */
export function ProductFilters({
  categories,
  filters,
}: {
  categories: string[];
  filters: ProductFilterState;
}) {
  const { search, category, sortBy = "createdAt", descending = true } = filters;

  return (
    <div className="glass space-y-4 rounded-card border border-line p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Kategoriye göre filtrele" className="flex flex-wrap gap-2">
          <ChipLink
            href={productsHref({ ...filters, category: undefined })}
            active={!category}
          >
            Tümü
          </ChipLink>
          {categories.map((value) => (
            <ChipLink
              key={value}
              href={productsHref({ ...filters, category: value })}
              active={category === value}
            >
              {value}
            </ChipLink>
          ))}
        </nav>

        <SearchForm
          action="/products"
          label="Ürün ara"
          placeholder="Ürün ara…"
          defaultValue={search}
          hidden={{
            category,
            sortBy,
            descending: descending ? undefined : "false",
            isActive:
              filters.isActive === undefined
                ? undefined
                : String(filters.isActive),
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-subtle">Sırala</span>
          {PRODUCT_SORT_OPTIONS.map((option) => (
            <ChipLink
              key={option.value}
              href={productsHref({ ...filters, sortBy: option.value })}
              active={sortBy === option.value}
            >
              {option.label}
            </ChipLink>
          ))}
          <ChipLink
            href={productsHref({ ...filters, descending: !descending })}
            active={false}
          >
            {descending ? <ArrowDownWideNarrow /> : <ArrowUpNarrowWide />}
            {descending ? "Azalan" : "Artan"}
          </ChipLink>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-subtle">Durum</span>
          {STATUS_OPTIONS.map((option) => (
            <ChipLink
              key={option.label}
              href={productsHref({ ...filters, isActive: option.value })}
              active={filters.isActive === option.value}
            >
              {option.label}
            </ChipLink>
          ))}
        </div>
      </div>
    </div>
  );
}

export type { ProductSortBy };
