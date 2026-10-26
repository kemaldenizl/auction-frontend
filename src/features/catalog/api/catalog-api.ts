import {
  createHttpClient,
  type HttpClient,
  type PagedResult,
} from "@/shared/api";
import { env } from "@/shared/config/env";

import type {
  Product,
  ProductDraft,
  ProductListQuery,
} from "../model/product";

/** Catalog service, reached through the gateway at `/api/products`. */
export function createCatalogApi(http: HttpClient) {
  return {
    listProducts: (query: ProductListQuery = {}) =>
      http.get<PagedResult<Product>>("/api/products", { query: { ...query } }),

    getProduct: (id: string) => http.get<Product>(`/api/products/${id}`),

    createProduct: (draft: ProductDraft) =>
      http.post<Product>("/api/products", draft),

    updateProduct: (id: string, draft: Partial<ProductDraft>) =>
      http.put<Product>(`/api/products/${id}`, draft),

    deleteProduct: (id: string) => http.delete<void>(`/api/products/${id}`),

    listCategories: () => http.get<string[]>("/api/products/categories"),
  };
}

export type CatalogApi = ReturnType<typeof createCatalogApi>;

export const catalogApi = createCatalogApi(createHttpClient(env.apiUrl));
