import { PackageOpen } from "lucide-react";

import { attempt } from "@/shared/api";
import {
  ApiErrorPanel,
  EmptyState,
  Pagination,
  Skeleton,
  stagger,
} from "@/shared/ui";

import { catalogApi } from "../api/catalog-api";
import type { ProductListQuery } from "../model/product";
import {
  ProductFilters,
  productsHref,
  type ProductFilterState,
} from "./product-filters";
import { ProductCard } from "./product-card";

const PAGE_SIZE = 12;

/**
 * Async Server Component: the catalogue is read on the server, so the markup
 * streams into the page shell and no CORS hop is involved.
 */
export async function ProductCatalog({
  filters,
  page,
}: {
  filters: ProductFilterState;
  page: number;
}) {
  const query: ProductListQuery = { ...filters, page, pageSize: PAGE_SIZE };

  const [products, categories] = await Promise.all([
    attempt(catalogApi.listProducts(query)),
    attempt(catalogApi.listCategories()),
  ]);

  if (!products.ok) {
    return <ApiErrorPanel problem={products.error.problem} />;
  }

  return (
    <div className="space-y-8">
      {/* A failed category read must not hide the products themselves. */}
      <ProductFilters
        categories={categories.ok ? categories.data : []}
        filters={filters}
      />

      {products.data.items.length === 0 ? (
        <EmptyState
          icon={<PackageOpen />}
          title="Ürün bulunamadı"
          description="Aramanızı ya da filtreleri değiştirmeyi deneyin."
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.data.items.map((product, index) => (
            <li key={product.id}>
              <ProductCard product={product} style={stagger(index)} />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        result={products.data}
        hrefForPage={(target) => productsHref({ ...filters, page: target })}
      />
    </div>
  );
}

export function ProductCatalogSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-28 rounded-card" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-80 rounded-card" />
        ))}
      </div>
    </div>
  );
}
