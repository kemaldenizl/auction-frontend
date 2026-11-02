/** Mirrors the catalog service's `Product` record. JSON arrives camelCase. */
export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  startingPrice: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export type ProductSortBy = "name" | "price" | "createdAt";

export const PRODUCT_SORT_OPTIONS: {
  value: ProductSortBy;
  label: string;
}[] = [
  { value: "createdAt", label: "Eklenme" },
  { value: "name", label: "Ad" },
  { value: "price", label: "Fiyat" },
];

export interface ProductListQuery {
  /** Searches name **and** description, case- and accent-tolerant. */
  search?: string;
  category?: string;
  /** Defaults to `createdAt` on the server. */
  sortBy?: ProductSortBy;
  /** Defaults to `true` on the server. */
  descending?: boolean;
  /** Omit to get both active and inactive products. */
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * `name` is 3–200 characters and unique across the catalogue; a clash answers
 * `409 duplicate_product_name`.
 */
export interface ProductDraft {
  name: string;
  description: string | null;
  category: string;
  startingPrice: number;
  imageUrl: string | null;
}

/** `PUT` is a full replacement: a field left out is cleared, not kept. */
export interface ProductUpdate extends ProductDraft {
  isActive: boolean;
}

export function isProductSortBy(value: string): value is ProductSortBy {
  return value === "name" || value === "price" || value === "createdAt";
}
