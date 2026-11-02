import { apiHttp } from "@/features/auth/lib/api-http";
import type { HttpClient, PagedResult } from "@/shared/api";

import type {
  Product,
  ProductDraft,
  ProductListQuery,
  ProductUpdate,
} from "../model/product";

/**
 * Catalog service, reached through the gateway at `/api/products`.
 *
 * Reads are public; writes need `products.manage`. Deleting a product also
 * cancels its not-yet-started auctions, and that cancellation reaches open
 * rooms as an `AuctionCancelled` event.
 */
export function createCatalogApi(http: HttpClient) {
  return {
    listProducts: (query: ProductListQuery = {}, signal?: AbortSignal) =>
      http.get<PagedResult<Product>>("/api/products", {
        query: { ...query },
        signal,
      }),

    getProduct: (id: string, signal?: AbortSignal) =>
      http.get<Product>(`/api/products/${id}`, { signal }),

    createProduct: (draft: ProductDraft) =>
      http.post<Product>("/api/products", draft),

    /** Full replacement — send every field you want to keep. */
    updateProduct: (id: string, draft: ProductUpdate) =>
      http.put<Product>(`/api/products/${id}`, draft),

    deleteProduct: (id: string) => http.delete<void>(`/api/products/${id}`),

    listCategories: (signal?: AbortSignal) =>
      http.get<string[]>("/api/products/categories", { signal }),
  };
}

export type CatalogApi = ReturnType<typeof createCatalogApi>;

export const catalogApi = createCatalogApi(apiHttp);
