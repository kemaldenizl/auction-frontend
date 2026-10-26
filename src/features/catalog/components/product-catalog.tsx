import { attempt } from "@/shared/api";
import { ApiErrorPanel, EmptyState, Pagination, Skeleton } from "@/shared/ui";

import { catalogApi } from "../api/catalog-api";
import { CategoryFilter } from "./category-filter";
import { ProductCard } from "./product-card";

const PAGE_SIZE = 12;

function catalogHref(page: number, category?: string): string {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

/**
 * Async Server Component: the catalog is read on the server, so no API key or
 * CORS hop is involved and the markup streams into the page shell.
 */
export async function ProductCatalog({
  category,
  page,
}: {
  category?: string;
  page: number;
}) {
  const [products, categories] = await Promise.all([
    attempt(
      catalogApi.listProducts({ category, page, pageSize: PAGE_SIZE }),
    ),
    attempt(catalogApi.listCategories()),
  ]);

  if (!products.ok) {
    return <ApiErrorPanel problem={products.error.problem} />;
  }

  return (
    <div className="space-y-6">
      {/* A failed category read must not hide the products themselves. */}
      {categories.ok && (
        <CategoryFilter categories={categories.data} selected={category} />
      )}

      {products.data.items.length === 0 ? (
        <EmptyState
          title="Ürün bulunamadı"
          description="Bu filtreyle eşleşen ürün yok. Katalog servisinde veri var mı?"
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.data.items.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        result={products.data}
        hrefForPage={(target) => catalogHref(target, category)}
      />
    </div>
  );
}

export function ProductCatalogSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-72" />
        ))}
      </div>
    </div>
  );
}
